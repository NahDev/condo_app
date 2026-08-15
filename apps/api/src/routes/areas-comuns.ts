import type { FastifyInstance } from "fastify";
import { criarAreaComumSchema } from "@condo/shared";
import { prisma } from "@condo/db";
import { authenticate, requirePermissao } from "../auth/hooks";

export async function areasComunsRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authenticate);

  app.get("/areas-comuns", { preHandler: requirePermissao("AREAS_COMUNS") }, async (request) => {
    return prisma.areaComum.findMany({
      where: { condominioId: request.usuario!.condominioId },
      orderBy: { nome: "asc" },
    });
  });

  app.post(
    "/areas-comuns",
    { preHandler: requirePermissao("AREAS_COMUNS", { gerenciar: true }) },
    async (request, reply) => {
      const parsed = criarAreaComumSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ message: "Dados inválidos", issues: parsed.error.issues });
      }

      const area = await prisma.areaComum.create({
        data: {
          nome: parsed.data.nome,
          regras: parsed.data.regras ?? null,
          condominioId: request.usuario!.condominioId,
        },
      });

      return reply.code(201).send(area);
    },
  );
}
