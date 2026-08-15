"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { Unidade, Visitante } from "@condo/shared";
import { ApiError } from "@condo/shared";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { temPermissao } from "@/lib/permissions";

function formatarData(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function VisitantesPage() {
  const { usuario } = useAuth();
  const podeRegistrar = temPermissao(usuario, "VISITANTES", "gerenciar");

  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [visitantes, setVisitantes] = useState<Visitante[]>([]);
  const [unidadeId, setUnidadeId] = useState("");
  const [nome, setNome] = useState("");
  const [documento, setDocumento] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function carregar() {
    setCarregando(true);
    try {
      const [unidadesResp, visitantesResp] = await Promise.all([
        podeRegistrar ? api.listarUnidades() : Promise.resolve([]),
        api.listarVisitantes(),
      ]);
      setUnidades(unidadesResp);
      setVisitantes(visitantesResp);
      if (!unidadeId && unidadesResp.length > 0) {
        setUnidadeId(unidadesResp[0]!.id);
      }
    } catch (err) {
      setErro(
        err instanceof ApiError && err.status === 403
          ? "Você não tem acesso a esta área."
          : "Não foi possível carregar os visitantes.",
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!unidadeId || !nome.trim()) return;
    setEnviando(true);
    setErro(null);
    try {
      await api.registrarVisitante(unidadeId, nome.trim(), documento.trim() || undefined);
      setNome("");
      setDocumento("");
      await carregar();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Não foi possível registrar a entrada.");
    } finally {
      setEnviando(false);
    }
  }

  async function handleSaida(id: string) {
    try {
      await api.registrarSaidaVisitante(id);
      await carregar();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Não foi possível registrar a saída.");
    }
  }

  const dentroDoCondominio = visitantes.filter((v) => !v.saida);
  const jaSairam = visitantes.filter((v) => v.saida);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Visitantes</h1>
        <p className="text-sm text-slate-500">Controle de entrada e saída de visitantes.</p>
      </div>

      {podeRegistrar && (
        <form onSubmit={handleSubmit} className="space-y-2 rounded-md border border-slate-200 bg-white p-4">
          <select
            value={unidadeId}
            onChange={(e) => setUnidadeId(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          >
            {unidades.map((u) => (
              <option key={u.id} value={u.id}>
                {u.identificacao}
              </option>
            ))}
          </select>
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Nome do visitante"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
          <input
            value={documento}
            onChange={(e) => setDocumento(e.target.value)}
            placeholder="Documento (opcional)"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={enviando}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {enviando ? "Registrando..." : "Registrar entrada"}
          </button>
        </form>
      )}

      {erro && <p className="text-sm text-red-600">{erro}</p>}

      {carregando ? (
        <p className="text-sm text-slate-500">Carregando...</p>
      ) : (
        <div className="space-y-4">
          <div>
            <h2 className="mb-2 text-sm font-medium text-slate-700">No condomínio agora</h2>
            <ul className="space-y-2">
              {dentroDoCondominio.map((v) => (
                <li
                  key={v.id}
                  className="flex items-center justify-between rounded-md border border-slate-200 bg-white p-3"
                >
                  <div>
                    <p className="text-sm font-medium">{v.nome}</p>
                    <p className="text-xs text-slate-400">
                      {v.unidadeIdentificacao} · entrou {formatarData(v.entrada)} · registrado por{" "}
                      {v.registradoPorNome}
                    </p>
                  </div>
                  {podeRegistrar && (
                    <button
                      onClick={() => handleSaida(v.id)}
                      className="text-sm text-slate-600 hover:text-slate-900"
                    >
                      Registrar saída
                    </button>
                  )}
                </li>
              ))}
              {dentroDoCondominio.length === 0 && (
                <li className="rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-400">
                  Nenhum visitante no condomínio.
                </li>
              )}
            </ul>
          </div>

          {jaSairam.length > 0 && (
            <div>
              <h2 className="mb-2 text-sm font-medium text-slate-700">Histórico</h2>
              <ul className="space-y-2">
                {jaSairam.map((v) => (
                  <li key={v.id} className="rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-500">
                    {v.nome} · {v.unidadeIdentificacao} · {formatarData(v.entrada)} —{" "}
                    {formatarData(v.saida!)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
