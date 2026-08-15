"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { Ocorrencia, StatusOcorrencia } from "@condo/shared";
import { ApiError } from "@condo/shared";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { temPermissao } from "@/lib/permissions";

const STATUS_LABEL: Record<StatusOcorrencia, string> = {
  ABERTA: "Aberta",
  EM_ANDAMENTO: "Em andamento",
  RESOLVIDA: "Resolvida",
};

const STATUS_COR: Record<StatusOcorrencia, string> = {
  ABERTA: "bg-amber-100 text-amber-800",
  EM_ANDAMENTO: "bg-blue-100 text-blue-800",
  RESOLVIDA: "bg-green-100 text-green-800",
};

const PROXIMO_STATUS: Partial<Record<StatusOcorrencia, { status: StatusOcorrencia; label: string }>> = {
  ABERTA: { status: "EM_ANDAMENTO", label: "Iniciar atendimento" },
  EM_ANDAMENTO: { status: "RESOLVIDA", label: "Marcar como resolvida" },
};

function formatarData(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function OcorrenciasPage() {
  const { usuario } = useAuth();
  const podeGerenciar = temPermissao(usuario, "OCORRENCIAS", "gerenciar");

  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [titulo, setTitulo] = useState("");
  const [categoria, setCategoria] = useState("");
  const [descricao, setDescricao] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function carregar() {
    setCarregando(true);
    try {
      setOcorrencias(await api.listarOcorrencias());
    } catch (err) {
      setErro(
        err instanceof ApiError && err.status === 403
          ? "Você não tem acesso a esta área."
          : "Não foi possível carregar as ocorrências.",
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!titulo.trim() || !descricao.trim()) return;
    setEnviando(true);
    setErro(null);
    try {
      await api.criarOcorrencia(titulo.trim(), descricao.trim(), categoria.trim() || undefined);
      setTitulo("");
      setCategoria("");
      setDescricao("");
      await carregar();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Não foi possível abrir o chamado.");
    } finally {
      setEnviando(false);
    }
  }

  async function avancarStatus(id: string, status: StatusOcorrencia) {
    try {
      await api.atualizarStatusOcorrencia(id, status);
      await carregar();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Não foi possível atualizar o status.");
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Ocorrências</h1>
        <p className="text-sm text-slate-500">Abra e acompanhe chamados do condomínio.</p>
      </div>

      {podeGerenciar && (
      <form onSubmit={handleSubmit} className="space-y-2 rounded-md border border-slate-200 bg-white p-4">
        <input
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Título (ex: Vazamento na garagem)"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
        <input
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          placeholder="Categoria (opcional, ex: Hidráulica)"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
        <textarea
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          placeholder="Descreva o problema..."
          rows={3}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={enviando}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {enviando ? "Abrindo..." : "Abrir chamado"}
        </button>
      </form>
      )}

      {erro && <p className="text-sm text-red-600">{erro}</p>}

      {carregando ? (
        <p className="text-sm text-slate-500">Carregando...</p>
      ) : (
        <ul className="space-y-3">
          {ocorrencias.map((oc) => {
            const proximo = podeGerenciar ? PROXIMO_STATUS[oc.status] : undefined;
            return (
              <li key={oc.id} className="rounded-md border border-slate-200 bg-white p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="font-medium">{oc.titulo}</h2>
                    {oc.categoria && <p className="text-xs text-slate-400">{oc.categoria}</p>}
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COR[oc.status]}`}>
                    {STATUS_LABEL[oc.status]}
                  </span>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{oc.descricao}</p>
                <p className="mt-2 text-xs text-slate-400">
                  {oc.unidadeIdentificacao ?? "sem unidade"} · aberto por {oc.criadoPorNome} em{" "}
                  {formatarData(oc.createdAt)}
                </p>
                {proximo && (
                  <button
                    onClick={() => avancarStatus(oc.id, proximo.status)}
                    className="mt-3 text-sm text-slate-700 underline hover:text-slate-900"
                  >
                    {proximo.label}
                  </button>
                )}
              </li>
            );
          })}
          {ocorrencias.length === 0 && (
            <li className="rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-400">
              Nenhuma ocorrência registrada.
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
