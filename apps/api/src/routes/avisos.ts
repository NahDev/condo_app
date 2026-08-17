import type { FastifyInstance } from "fastify";
import { criarAvisoSchema } from "@condo/shared";
import { prisma } from "@condo/db";
import { authenticate, requirePermissao } from "../auth/hooks";
import { lerMultipart } from "../lib/multipart";
import { extensaoPermitida, salvarImagem } from "../lib/storage";

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
      fotoUrl: aviso.fotoUrl,
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
      const { campos, foto } = await lerMultipart(request);
      const parsed = criarAvisoSchema.safeParse(campos);
      if (!parsed.success) {
        return reply.code(400).send({ message: "Dados inválidos", issues: parsed.error.issues });
      }

      let fotoUrl: string | null = null;
      if (foto) {
        if (!extensaoPermitida(foto.mimetype)) {
          return reply
            .code(400)
            .send({ message: "Formato de imagem não suportado. Use JPG, PNG ou WEBP." });
        }
        fotoUrl = await salvarImagem(foto.buffer, foto.mimetype, "avisos");
      }

      const aviso = await prisma.aviso.create({
        data: {
          titulo: parsed.data.titulo,
          corpo: parsed.data.corpo,
          fotoUrl,
          condominioId: request.usuario!.condominioId,
          autorId: request.usuario!.sub,
        },
        include: { autor: { select: { nome: true } } },
      });

      return reply.code(201).send({
        id: aviso.id,
        titulo: aviso.titulo,
        corpo: aviso.corpo,
        fotoUrl: aviso.fotoUrl,
        condominioId: aviso.condominioId,
        autorId: aviso.autorId,
        autorNome: aviso.autor.nome,
        createdAt: aviso.createdAt,
      });
    },
  );
}
