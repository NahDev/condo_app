import type { FastifyInstance } from "fastify";
import { criarUnidadeSchema, criarUnidadesLoteSchema } from "@condo/shared";
import { prisma } from "@condo/db";
import { authenticate, requirePermissao } from "../auth/hooks";

export async function unidadesRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authenticate);

  app.get("/unidades", { preHandler: requirePermissao("UNIDADES") }, async (request) => {
    return prisma.unidade.findMany({
      where: { condominioId: request.usuario!.condominioId },
      orderBy: { identificacao: "asc" },
    });
  });

  app.post(
    "/unidades",
    { preHandler: requirePermissao("UNIDADES", { gerenciar: true }) },
    async (request, reply) => {
      const parsed = criarUnidadeSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ message: "Dados inválidos", issues: parsed.error.issues });
      }

      const unidade = await prisma.unidade.create({
        data: {
          identificacao: parsed.data.identificacao,
          condominioId: request.usuario!.condominioId,
        },
      });

      return reply.code(201).send(unidade);
    },
  );

  app.post(
    "/unidades/lote",
    { preHandler: requirePermissao("UNIDADES", { gerenciar: true }) },
    async (request, reply) => {
      const parsed = criarUnidadesLoteSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ message: "Dados inválidos", issues: parsed.error.issues });
      }

      const condominioId = request.usuario!.condominioId;
      const identificacoes = [...new Set(parsed.data.identificacoes.map((s) => s.trim()))].filter(
        Boolean,
      );

      const existentes = await prisma.unidade.findMany({
        where: { condominioId, identificacao: { in: identificacoes } },
        select: { identificacao: true },
      });
      const jaExistem = new Set(existentes.map((u) => u.identificacao));
      const novas = identificacoes.filter((id) => !jaExistem.has(id));

      if (novas.length > 0) {
        await prisma.unidade.createMany({
          data: novas.map((identificacao) => ({ identificacao, condominioId })),
        });
      }

      const criadas = await prisma.unidade.findMany({
        where: { condominioId, identificacao: { in: novas } },
        orderBy: { identificacao: "asc" },
      });

      return reply.code(201).send({ criadas, duplicadas: [...jaExistem] });
    },
  );
}
