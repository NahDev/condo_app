import type {
  AreaComum,
  AuthResponse,
  Aviso,
  CriarUnidadesLoteResposta,
  Encomenda,
  Ocorrencia,
  Papel,
  Reserva,
  StatusOcorrencia,
  Unidade,
  UsuarioAdmin,
  Visitante,
} from "./types";
import type { PermissaoRecurso } from "./permissions";

export interface ApiClientOptions {
  baseUrl: string;
  getAccessToken?: () => string | null;
  onUnauthorized?: () => void;
  /** Chamado quando uma requisição recebe 401. Deve devolver o novo access token, ou null se não foi possível renovar. */
  refreshAccessToken?: () => Promise<string | null>;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

const ROTAS_SEM_REFRESH = new Set(["/auth/login", "/auth/refresh"]);

export function createApiClient(options: ApiClientOptions) {
  async function request<T>(path: string, init?: RequestInit, tentandoNovamente = false): Promise<T> {
    const token = options.getAccessToken?.();
    const res = await fetch(`${options.baseUrl}${path}`, {
      ...init,
      headers: {
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init?.headers,
      },
    });

    if (
      res.status === 401 &&
      !tentandoNovamente &&
      !ROTAS_SEM_REFRESH.has(path) &&
      options.refreshAccessToken
    ) {
      const novoToken = await options.refreshAccessToken();
      if (novoToken) {
        return request<T>(path, init, true);
      }
    }

    if (res.status === 401) {
      options.onUnauthorized?.();
    }

    if (!res.ok) {
      const body = (await res
        .json()
        .catch(() => ({ message: res.statusText }))) as { message?: string };
      throw new ApiError(res.status, body.message ?? "Erro na requisição");
    }

    if (res.status === 204) return undefined as T;
    return res.json() as Promise<T>;
  }

  return {
    login: (email: string, senha: string) =>
      request<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, senha }),
      }),
    logout: (refreshToken: string) =>
      request<void>("/auth/logout", {
        method: "POST",
        body: JSON.stringify({ refreshToken }),
      }),
    listarUnidades: () => request<Unidade[]>("/unidades"),
    criarUnidade: (identificacao: string) =>
      request<Unidade>("/unidades", {
        method: "POST",
        body: JSON.stringify({ identificacao }),
      }),
    criarUnidadesLote: (identificacoes: string[]) =>
      request<CriarUnidadesLoteResposta>("/unidades/lote", {
        method: "POST",
        body: JSON.stringify({ identificacoes }),
      }),
    listarAvisos: () => request<Aviso[]>("/avisos"),
    criarAviso: (titulo: string, corpo: string) =>
      request<Aviso>("/avisos", {
        method: "POST",
        body: JSON.stringify({ titulo, corpo }),
      }),
    listarAreasComuns: () => request<AreaComum[]>("/areas-comuns"),
    criarAreaComum: (nome: string, regras?: string) =>
      request<AreaComum>("/areas-comuns", {
        method: "POST",
        body: JSON.stringify({ nome, regras }),
      }),
    listarReservas: () => request<Reserva[]>("/reservas"),
    criarReserva: (areaComumId: string, inicio: string, fim: string) =>
      request<Reserva>("/reservas", {
        method: "POST",
        body: JSON.stringify({ areaComumId, inicio, fim }),
      }),
    cancelarReserva: (id: string) =>
      request<void>(`/reservas/${id}`, { method: "DELETE" }),
    listarOcorrencias: () => request<Ocorrencia[]>("/ocorrencias"),
    criarOcorrencia: (titulo: string, descricao: string, categoria?: string) =>
      request<Ocorrencia>("/ocorrencias", {
        method: "POST",
        body: JSON.stringify({ titulo, descricao, categoria }),
      }),
    atualizarStatusOcorrencia: (id: string, status: StatusOcorrencia) =>
      request<Ocorrencia>(`/ocorrencias/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    listarVisitantes: () => request<Visitante[]>("/visitantes"),
    registrarVisitante: (
      unidadeId: string,
      nome: string,
      documento?: string,
      observacao?: string,
    ) =>
      request<Visitante>("/visitantes", {
        method: "POST",
        body: JSON.stringify({ unidadeId, nome, documento, observacao }),
      }),
    registrarSaidaVisitante: (id: string) =>
      request<Visitante>(`/visitantes/${id}/saida`, { method: "PATCH" }),
    listarEncomendas: () => request<Encomenda[]>("/encomendas"),
    registrarEncomenda: (unidadeId: string, descricao?: string) =>
      request<Encomenda>("/encomendas", {
        method: "POST",
        body: JSON.stringify({ unidadeId, descricao }),
      }),
    retirarEncomenda: (id: string, retiradaPor?: string) =>
      request<Encomenda>(`/encomendas/${id}/retirada`, {
        method: "PATCH",
        body: JSON.stringify({ retiradaPor }),
      }),
    listarUsuarios: () => request<UsuarioAdmin[]>("/usuarios"),
    criarUsuario: (input: {
      nome: string;
      email: string;
      senha: string;
      papel: Papel;
      unidadeId?: string;
    }) =>
      request<UsuarioAdmin>("/usuarios", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    atualizarStatusUsuario: (id: string, ativo: boolean) =>
      request<UsuarioAdmin>(`/usuarios/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ ativo }),
      }),
    atualizarPermissoesUsuario: (id: string, permissoes: PermissaoRecurso[]) =>
      request<UsuarioAdmin>(`/usuarios/${id}/permissoes`, {
        method: "PUT",
        body: JSON.stringify({ permissoes }),
      }),
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
