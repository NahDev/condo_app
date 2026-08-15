import { z } from "zod";
import { RECURSOS } from "./permissions";

export const loginSchema = z.object({
  email: z.string().email(),
  senha: z.string().min(6),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const criarUnidadeSchema = z.object({
  identificacao: z.string().min(1),
});
export type CriarUnidadeInput = z.infer<typeof criarUnidadeSchema>;

export const criarUnidadesLoteSchema = z.object({
  identificacoes: z.array(z.string().min(1).max(120)).min(1).max(500),
});
export type CriarUnidadesLoteInput = z.infer<typeof criarUnidadesLoteSchema>;

export const criarAvisoSchema = z.object({
  titulo: z.string().min(1).max(120),
  corpo: z.string().min(1),
});
export type CriarAvisoInput = z.infer<typeof criarAvisoSchema>;

export const criarAreaComumSchema = z.object({
  nome: z.string().min(1).max(120),
  regras: z.string().max(1000).optional(),
});
export type CriarAreaComumInput = z.infer<typeof criarAreaComumSchema>;

export const criarReservaSchema = z
  .object({
    areaComumId: z.string().min(1),
    inicio: z.string().datetime(),
    fim: z.string().datetime(),
  })
  .refine((data) => new Date(data.fim) > new Date(data.inicio), {
    message: "O horário de término deve ser depois do início",
    path: ["fim"],
  });
export type CriarReservaInput = z.infer<typeof criarReservaSchema>;

export const criarOcorrenciaSchema = z.object({
  titulo: z.string().min(1).max(120),
  descricao: z.string().min(1),
  categoria: z.string().max(60).optional(),
});
export type CriarOcorrenciaInput = z.infer<typeof criarOcorrenciaSchema>;

export const statusOcorrenciaSchema = z.enum(["ABERTA", "EM_ANDAMENTO", "RESOLVIDA"]);

export const atualizarStatusOcorrenciaSchema = z.object({
  status: statusOcorrenciaSchema,
});
export type AtualizarStatusOcorrenciaInput = z.infer<typeof atualizarStatusOcorrenciaSchema>;

export const criarVisitanteSchema = z.object({
  unidadeId: z.string().min(1),
  nome: z.string().min(1).max(120),
  documento: z.string().max(60).optional(),
  observacao: z.string().max(500).optional(),
});
export type CriarVisitanteInput = z.infer<typeof criarVisitanteSchema>;

export const criarEncomendaSchema = z.object({
  unidadeId: z.string().min(1),
  descricao: z.string().max(200).optional(),
});
export type CriarEncomendaInput = z.infer<typeof criarEncomendaSchema>;

export const retirarEncomendaSchema = z.object({
  retiradaPor: z.string().max(120).optional(),
});
export type RetirarEncomendaInput = z.infer<typeof retirarEncomendaSchema>;

export const criarUsuarioSchema = z.object({
  nome: z.string().min(1).max(120),
  email: z.string().email(),
  senha: z.string().min(6),
  papel: z.enum(["SINDICO", "MORADOR", "PORTEIRO"]),
  unidadeId: z.string().min(1).optional(),
});
export type CriarUsuarioInput = z.infer<typeof criarUsuarioSchema>;

export const atualizarStatusUsuarioSchema = z.object({
  ativo: z.boolean(),
});
export type AtualizarStatusUsuarioInput = z.infer<typeof atualizarStatusUsuarioSchema>;

export const atualizarPermissoesSchema = z.object({
  permissoes: z.array(
    z.object({
      recurso: z.enum(RECURSOS),
      podeVisualizar: z.boolean(),
      podeGerenciar: z.boolean(),
    }),
  ),
});
export type AtualizarPermissoesInput = z.infer<typeof atualizarPermissoesSchema>;
