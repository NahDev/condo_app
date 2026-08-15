import type { FastifyInstance } from "fastify";
import { criarAvisoSchema } from "@condo/shared";
import { prisma } from "@condo/db";
import { authenticate, requirePermissao } from "../auth/hooks";

export async function avisosRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authenticate);

  app.get("/avisos", { preHandler: requirePermissao("AVISOS") }, async (request) => {
    const avisos = await prisma.aviso.findMany({
      where: { condominioId: request.usuario!.condominioId },
      orderBy: { createdAt: "desc" },
      include: { autor: { select: { nome: true } } },
    });

    return avisos.map((aviso) => ({
      id: aviso.id,
      titulo: aviso.titulo,
      corpo: aviso.corpo,
      condominioId: aviso.condominioId,
      autorId: aviso.autorId,
      autorNome: aviso.autor.nome,
      createdAt: aviso.createdAt,
    }));
  });

  app.post(
    "/avisos",
    { preHandler: requirePermissao("AVISOS", { gerenciar: true }) },
    async (request, reply) => {
      const parsed = criarAvisoSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ message: "Dados inválidos", issues: parsed.error.issues });
      }

      const aviso = await prisma.aviso.create({
        data: {
          titulo: parsed.data.titulo,
          corpo: parsed.data.corpo,
          condominioId: request.usuario!.condominioId,
          autorId: request.usuario!.sub,
        },
        include: { autor: { select: { nome: true } } },
      });

      return reply.code(201).send({
        id: aviso.id,
        titulo: aviso.titulo,
        corpo: aviso.corpo,
        condominioId: aviso.condominioId,
        autorId: aviso.autorId,
        autorNome: aviso.autor.nome,
        createdAt: aviso.createdAt,
      });
    },
  );
}
