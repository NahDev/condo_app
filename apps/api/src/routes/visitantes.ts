import type { FastifyInstance } from "fastify";
import { criarVisitanteSchema } from "@condo/shared";
import { prisma } from "@condo/db";
import { authenticate, requirePermissao } from "../auth/hooks";
import { decryptField, encryptField, maskDocumento } from "../lib/crypto";
import { lerMultipart } from "../lib/multipart";
import { extensaoPermitida, salvarImagem } from "../lib/storage";

/**
 * Decripta o documento; se o valor não estiver no formato criptografado (ex: dado
 * gravado antes desta funcionalidade existir), trata como texto legado e mascara
 * o valor bruto em vez de derrubar a listagem inteira.
 */
function decriptarDocumento(valor: string): string {
  try {
    return decryptField(valor);
  } catch {
    return valor;
  }
}

function toVisitantePublico(visitante: {
  id: string;
  nome: string;
  documento: string | null;
  observacao: string | null;
  fotoUrl: string | null;
  unidadeId: string;
  entrada: Date;
  saida: Date | null;
  unidade: { identificacao: string };
  registradoPor: { nome: string };
}) {
  return {
    id: visitante.id,
    nome: visitante.nome,
    documento: visitante.documento ? maskDocumento(decriptarDocumento(visitante.documento)) : null,
    observacao: visitante.observacao,
    fotoUrl: visitante.fotoUrl,
    unidadeId: visitante.unidadeId,
    unidadeIdentificacao: visitante.unidade.identificacao,
    registradoPorNome: visitante.registradoPor.nome,
    entrada: visitante.entrada,
    saida: visitante.saida,
  };
}

const includeRelacoes = {
  unidade: { select: { identificacao: true } },
  registradoPor: { select: { nome: true } },
} as const;

export async function visitantesRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authenticate);

  app.get("/visitantes", { preHandler: requirePermissao("VISITANTES") }, async (request) => {
    const { condominioId, papel, unidadeId } = request.usuario!;
    const somenteMinhaUnidade = papel === "MORADOR" && unidadeId;

    const visitantes = await prisma.visitante.findMany({
      where: {
        condominioId,
        ...(somenteMinhaUnidade ? { unidadeId } : {}),
      },
      orderBy: { entrada: "desc" },
      include: includeRelacoes,
    });

    return visitantes.map(toVisitantePublico);
  });

  app.post(
    "/visitantes",
    { preHandler: requirePermissao("VISITANTES", { gerenciar: true }) },
    async (request, reply) => {
      const { campos, foto } = await lerMultipart(request);
      const parsed = criarVisitanteSchema.safeParse(campos);
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
        fotoUrl = await salvarImagem(foto.buffer, foto.mimetype, "visitantes");
      }

      const visitante = await prisma.visitante.create({
        data: {
          nome: parsed.data.nome,
          documento: parsed.data.documento ? encryptField(parsed.data.documento) : null,
          observacao: parsed.data.observacao ?? null,
          fotoUrl,
          unidadeId: parsed.data.unidadeId,
          condominioId: request.usuario!.condominioId,
          registradoPorId: request.usuario!.sub,
        },
        include: includeRelacoes,
      });

      return reply.code(201).send(toVisitantePublico(visitante));
    },
  );

  app.patch(
    "/visitantes/:id/saida",
    { preHandler: requirePermissao("VISITANTES", { gerenciar: true }) },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const visitante = await prisma.visitante.findFirst({
        where: { id, condominioId: request.usuario!.condominioId },
      });
      if (!visitante) {
        return reply.code(404).send({ message: "Visitante não encontrado" });
      }

      const atualizado = await prisma.visitante.update({
        where: { id },
        data: { saida: new Date() },
        include: includeRelacoes,
      });

      return toVisitantePublico(atualizado);
    },
  );
}
