import type { FastifyInstance } from "fastify";
import { criarReservaSchema } from "@condo/shared";
import { prisma } from "@condo/db";
import { authenticate, requirePermissao } from "../auth/hooks";

function toReservaPublica(reserva: {
  id: string;
  areaComumId: string;
  unidadeId: string;
  criadoPorId: string;
  inicio: Date;
  fim: Date;
  status: "CONFIRMADA" | "CANCELADA";
  areaComum: { nome: string };
  unidade: { identificacao: string };
  criadoPor: { nome: string };
}) {
  return {
    id: reserva.id,
    areaComumId: reserva.areaComumId,
    areaComumNome: reserva.areaComum.nome,
    unidadeId: reserva.unidadeId,
    unidadeIdentificacao: reserva.unidade.identificacao,
    criadoPorId: reserva.criadoPorId,
    criadoPorNome: reserva.criadoPor.nome,
    inicio: reserva.inicio,
    fim: reserva.fim,
    status: reserva.status,
  };
}

const includeRelacoes = {
  areaComum: { select: { nome: true } },
  unidade: { select: { identificacao: true } },
  criadoPor: { select: { nome: true } },
} as const;

export async function reservasRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authenticate);

  app.get("/reservas", { preHandler: requirePermissao("RESERVAS") }, async (request) => {
    const reservas = await prisma.reserva.findMany({
      where: { condominioId: request.usuario!.condominioId },
      orderBy: { inicio: "asc" },
      include: includeRelacoes,
    });

    return reservas.map(toReservaPublica);
  });

  app.post(
    "/reservas",
    { preHandler: requirePermissao("RESERVAS", { gerenciar: true }) },
    async (request, reply) => {
      const unidadeId = request.usuario!.unidadeId;
      if (!unidadeId) {
        return reply
          .code(400)
          .send({ message: "Seu usuário não está vinculado a uma unidade" });
      }

      const parsed = criarReservaSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ message: "Dados inválidos", issues: parsed.error.issues });
      }

      const { areaComumId, inicio, fim } = parsed.data;
      const condominioId = request.usuario!.condominioId;

      const area = await prisma.areaComum.findFirst({
        where: { id: areaComumId, condominioId },
      });
      if (!area) {
        return reply.code(404).send({ message: "Área comum não encontrada" });
      }

      const inicioDate = new Date(inicio);
      const fimDate = new Date(fim);

      const conflito = await prisma.reserva.findFirst({
        where: {
          areaComumId,
          status: "CONFIRMADA",
          inicio: { lt: fimDate },
          fim: { gt: inicioDate },
        },
      });
      if (conflito) {
        return reply.code(409).send({ message: "Já existe uma reserva para esse horário" });
      }

      const reserva = await prisma.reserva.create({
        data: {
          areaComumId,
          unidadeId,
          condominioId,
          criadoPorId: request.usuario!.sub,
          inicio: inicioDate,
          fim: fimDate,
        },
        include: includeRelacoes,
      });

      return reply.code(201).send(toReservaPublica(reserva));
    },
  );

  app.delete(
    "/reservas/:id",
    { preHandler: requirePermissao("RESERVAS", { gerenciar: true }) },
    async (request, reply) => {
    const { id } = request.params as { id: string };
    const reserva = await prisma.reserva.findFirst({
      where: { id, condominioId: request.usuario!.condominioId },
    });

    if (!reserva) {
      return reply.code(404).send({ message: "Reserva não encontrada" });
    }

    const podeCancelar =
      reserva.criadoPorId === request.usuario!.sub ||
      request.usuario!.papel === "SINDICO" ||
      request.usuario!.papel === "ADMIN";

    if (!podeCancelar) {
      return reply.code(403).send({ message: "Permissão insuficiente" });
    }

    await prisma.reserva.update({ where: { id }, data: { status: "CANCELADA" } });

      return reply.code(204).send();
    },
  );
}
