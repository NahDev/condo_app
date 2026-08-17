import type { FastifyInstance } from "fastify";
import { atualizarStatusOcorrenciaSchema, criarOcorrenciaSchema } from "@condo/shared";
import { prisma } from "@condo/db";
import { authenticate, requirePermissao } from "../auth/hooks";
import { lerMultipart } from "../lib/multipart";
import { extensaoPermitida, salvarImagem } from "../lib/storage";

function toOcorrenciaPublica(ocorrencia: {
  id: string;
  titulo: string;
  descricao: string;
  categoria: string | null;
  fotoUrl: string | null;
  status: "ABERTA" | "EM_ANDAMENTO" | "RESOLVIDA";
  unidadeId: string | null;
  criadoPorId: string;
  createdAt: Date;
  unidade: { identificacao: string } | null;
  criadoPor: { nome: string };
}) {
  return {
    id: ocorrencia.id,
    titulo: ocorrencia.titulo,
    descricao: ocorrencia.descricao,
    categoria: ocorrencia.categoria,
    fotoUrl: ocorrencia.fotoUrl,
    status: ocorrencia.status,
    unidadeId: ocorrencia.unidadeId,
    unidadeIdentificacao: ocorrencia.unidade?.identificacao ?? null,
    criadoPorId: ocorrencia.criadoPorId,
    criadoPorNome: ocorrencia.criadoPor.nome,
    createdAt: ocorrencia.createdAt,
  };
}

const includeRelacoes = {
  unidade: { select: { identificacao: true } },
  criadoPor: { select: { nome: true } },
} as const;

export async function ocorrenciasRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authenticate);

  app.get("/ocorrencias", { preHandler: requirePermissao("OCORRENCIAS") }, async (request) => {
    const ocorrencias = await prisma.ocorrencia.findMany({
      where: { condominioId: request.usuario!.condominioId },
      orderBy: { createdAt: "desc" },
      include: includeRelacoes,
    });

    return ocorrencias.map(toOcorrenciaPublica);
  });

  app.post(
    "/ocorrencias",
    { preHandler: requirePermissao("OCORRENCIAS", { gerenciar: true }) },
    async (request, reply) => {
      const { campos, foto } = await lerMultipart(request);
      const parsed = criarOcorrenciaSchema.safeParse(campos);
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
        fotoUrl = await salvarImagem(foto.buffer, foto.mimetype, "ocorrencias");
      }

      const ocorrencia = await prisma.ocorrencia.create({
        data: {
          titulo: parsed.data.titulo,
          descricao: parsed.data.descricao,
          categoria: parsed.data.categoria ?? null,
          fotoUrl,
          condominioId: request.usuario!.condominioId,
          unidadeId: request.usuario!.unidadeId,
          criadoPorId: request.usuario!.sub,
        },
        include: includeRelacoes,
      });

      return reply.code(201).send(toOcorrenciaPublica(ocorrencia));
    },
  );

  app.patch(
    "/ocorrencias/:id/status",
    { preHandler: requirePermissao("OCORRENCIAS", { gerenciar: true }) },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const parsed = atualizarStatusOcorrenciaSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ message: "Dados inválidos", issues: parsed.error.issues });
      }

      const ocorrencia = await prisma.ocorrencia.findFirst({
        where: { id, condominioId: request.usuario!.condominioId },
      });
      if (!ocorrencia) {
        return reply.code(404).send({ message: "Ocorrência não encontrada" });
      }

      const atualizada = await prisma.ocorrencia.update({
        where: { id },
        data: { status: parsed.data.status },
        include: includeRelacoes,
      });

      return toOcorrenciaPublica(atualizada);
    },
  );
}
