export const RECURSOS = [
  "AVISOS",
  "UNIDADES",
  "AREAS_COMUNS",
  "RESERVAS",
  "OCORRENCIAS",
  "VISITANTES",
  "ENCOMENDAS",
] as const;

export type Recurso = (typeof RECURSOS)[number];

export const RECURSO_LABEL: Record<Recurso, string> = {
  AVISOS: "Avisos",
  UNIDADES: "Unidades",
  AREAS_COMUNS: "Áreas comuns",
  RESERVAS: "Reservas",
  OCORRENCIAS: "Ocorrências",
  VISITANTES: "Visitantes",
  ENCOMENDAS: "Encomendas",
};

export interface PermissaoRecurso {
  recurso: Recurso;
  podeVisualizar: boolean;
  podeGerenciar: boolean;
}

/**
 * Permissões padrão aplicadas quando um MORADOR ou PORTEIRO é criado.
 * SINDICO e ADMIN têm acesso total e não usam esta tabela.
 */
export const PERMISSOES_PADRAO: Record<"MORADOR" | "PORTEIRO", Record<Recurso, { podeVisualizar: boolean; podeGerenciar: boolean }>> = {
  MORADOR: {
    AVISOS: { podeVisualizar: true, podeGerenciar: false },
    UNIDADES: { podeVisualizar: true, podeGerenciar: false },
    AREAS_COMUNS: { podeVisualizar: true, podeGerenciar: false },
    RESERVAS: { podeVisualizar: true, podeGerenciar: true },
    OCORRENCIAS: { podeVisualizar: true, podeGerenciar: true },
    VISITANTES: { podeVisualizar: true, podeGerenciar: false },
    ENCOMENDAS: { podeVisualizar: true, podeGerenciar: false },
  },
  PORTEIRO: {
    AVISOS: { podeVisualizar: true, podeGerenciar: false },
    UNIDADES: { podeVisualizar: true, podeGerenciar: false },
    AREAS_COMUNS: { podeVisualizar: true, podeGerenciar: false },
    RESERVAS: { podeVisualizar: true, podeGerenciar: false },
    OCORRENCIAS: { podeVisualizar: false, podeGerenciar: false },
    VISITANTES: { podeVisualizar: true, podeGerenciar: true },
    ENCOMENDAS: { podeVisualizar: true, podeGerenciar: true },
  },
};
