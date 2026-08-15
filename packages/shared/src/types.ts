import type { PermissaoRecurso } from "./permissions";

export type Papel = "ADMIN" | "SINDICO" | "MORADOR" | "PORTEIRO";

export interface Condominio {
  id: string;
  nome: string;
  cnpj: string | null;
  endereco: string | null;
}

export interface Unidade {
  id: string;
  identificacao: string;
  condominioId: string;
}

export interface CriarUnidadesLoteResposta {
  criadas: Unidade[];
  duplicadas: string[];
}

export interface UsuarioPublico {
  id: string;
  nome: string;
  email: string;
  papel: Papel;
  condominioId: string;
  unidadeId: string | null;
  permissoes: PermissaoRecurso[];
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  usuario: UsuarioPublico;
}

export interface Aviso {
  id: string;
  titulo: string;
  corpo: string;
  condominioId: string;
  autorId: string;
  autorNome: string;
  createdAt: string;
}

export interface AreaComum {
  id: string;
  nome: string;
  regras: string | null;
  condominioId: string;
}

export type StatusReserva = "CONFIRMADA" | "CANCELADA";

export interface Reserva {
  id: string;
  areaComumId: string;
  areaComumNome: string;
  unidadeId: string;
  unidadeIdentificacao: string;
  criadoPorId: string;
  criadoPorNome: string;
  inicio: string;
  fim: string;
  status: StatusReserva;
}

export type StatusOcorrencia = "ABERTA" | "EM_ANDAMENTO" | "RESOLVIDA";

export interface Ocorrencia {
  id: string;
  titulo: string;
  descricao: string;
  categoria: string | null;
  status: StatusOcorrencia;
  unidadeId: string | null;
  unidadeIdentificacao: string | null;
  criadoPorId: string;
  criadoPorNome: string;
  createdAt: string;
}

export interface Visitante {
  id: string;
  nome: string;
  documento: string | null;
  observacao: string | null;
  unidadeId: string;
  unidadeIdentificacao: string;
  registradoPorNome: string;
  entrada: string;
  saida: string | null;
}

export interface Encomenda {
  id: string;
  descricao: string | null;
  unidadeId: string;
  unidadeIdentificacao: string;
  registradoPorNome: string;
  recebidaEm: string;
  retiradaEm: string | null;
  retiradaPor: string | null;
}

export interface UsuarioAdmin {
  id: string;
  nome: string;
  email: string;
  papel: Papel;
  ativo: boolean;
  unidadeId: string | null;
  unidadeIdentificacao: string | null;
  permissoes: PermissaoRecurso[];
}
