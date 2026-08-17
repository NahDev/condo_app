import type { FastifyInstance } from "fastify";
import { criarEncomendaSchema, retirarEncomendaSchema } from "@condo/shared";
import { prisma } from "@condo/db";
import { authenticate, requirePermissao } from "../auth/hooks";
import { lerMultipart } from "../lib/multipart";
import { extensaoPermitida, salvarImagem } from "../lib/storage";

function toEncomendaPublica(encomenda: {
  id: string;
  descricao: string | null;
  fotoUrl: string | null;
  unidadeId: string;
  recebidaEm: Date;
  retiradaEm: Date | null;
  retiradaPor: string | null;
  unidade: { identificacao: string };
  registradoPor: { nome: string };
}) {
  return {
    id: encomenda.id,
    descricao: encomenda.descricao,
    fotoUrl: encomenda.fotoUrl,
    unidadeId: encomenda.unidadeId,
    unidadeIdentificacao: encomenda.unidade.identificacao,
    registradoPorNome: encomenda.registradoPor.nome,
    recebidaEm: encomenda.recebidaEm,
    retiradaEm: encomenda.retiradaEm,
    retiradaPor: encomenda.retiradaPor,
  };
}

const includeRelacoes = {
  unidade: { select: { identificacao: true } },
  registradoPor: { select: { nome: true } },
} as const;

export async function encomendasRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authenticate);

  app.get("/encomendas", { preHandler: requirePermissao("ENCOMENDAS") }, async (request) => {
    const { condominioId, papel, unidadeId } = request.usuario!;
    const somenteMinhaUnidade = papel === "MORADOR" && unidadeId;

    const encomendas = await prisma.encomenda.findMany({
      where: {
        condominioId,
        ...(somenteMinhaUnidade ? { unidadeId } : {}),
      },
      orderBy: { recebidaEm: "desc" },
      include: includeRelacoes,
    });

    return encomendas.map(toEncomendaPublica);
  });

  app.post(
    "/encomendas",
    { preHandler: requirePermissao("ENCOMENDAS", { gerenciar: true }) },
    async (request, reply) => {
      const { campos, foto } = await lerMultipart(request);
      const parsed = criarEncomendaSchema.safeParse(campos);
      if (!parsed.success) {
        return reply.code(400).send({ message: "Dados inválidos", issues: parsed.error.issues });
      }

      const unidade = await prisma.unidade.findFirst({
        where: { id: parsed.data.unidadeId, condominioId: request.usuario!.condominioId },
      });
      if (!unidade) {
        return reply.code(404).send({ message: "Unidade não encontrada" });
      }

      let fotoUrl: string | null = null;
      if (foto) {
        if (!extensaoPermitida(foto.mimetype)) {
          return reply
            .code(400)
            .send({ message: "Formato de imagem não suportado. Use JPG, PNG ou WEBP." });
        }
        fotoUrl = await salvarImagem(foto.buffer, foto.mimetype, "encomendas");
      }

      const encomenda = await prisma.encomenda.create({
        data: {
          descricao: parsed.data.descricao ?? null,
          fotoUrl,
          unidadeId: parsed.data.unidadeId,
          condominioId: request.usuario!.condominioId,
          registradoPorId: request.usuario!.sub,
        },
        include: includeRelacoes,
      });

      return reply.code(201).send(toEncomendaPublica(encomenda));
    },
  );

  app.patch(
    "/encomendas/:id/retirada",
    { preHandler: requirePermissao("ENCOMENDAS", { gerenciar: true }) },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const parsed = retirarEncomendaSchema.safeParse(request.body ?? {});
      if (!parsed.success) {
        return reply.code(400).send({ message: "Dados inválidos", issues: parsed.error.issues });
      }

      const encomenda = await prisma.encomenda.findFirst({
        where: { id, condominioId: request.usuario!.condominioId },
      });
      if (!encomenda) {
        return reply.code(404).send({ message: "Encomenda não encontrada" });
      }

      const atualizada = await prisma.encomenda.update({
        where: { id },
        data: { retiradaEm: new Date(), retiradaPor: parsed.data.retiradaPor ?? null },
        include: includeRelacoes,
      });

      return toEncomendaPublica(atualizada);
    },
  );
}
