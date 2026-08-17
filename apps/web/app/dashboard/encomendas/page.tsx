"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { Encomenda, Unidade } from "@condo/shared";
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

export default function EncomendasPage() {
  const { usuario } = useAuth();
  const podeRegistrar = temPermissao(usuario, "ENCOMENDAS", "gerenciar");

  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [encomendas, setEncomendas] = useState<Encomenda[]>([]);
  const [unidadeId, setUnidadeId] = useState("");
  const [descricao, setDescricao] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function carregar() {
    setCarregando(true);
    try {
      const [unidadesResp, encomendasResp] = await Promise.all([
        podeRegistrar ? api.listarUnidades() : Promise.resolve([]),
        api.listarEncomendas(),
      ]);
      setUnidades(unidadesResp);
      setEncomendas(encomendasResp);
      if (!unidadeId && unidadesResp.length > 0) {
        setUnidadeId(unidadesResp[0]!.id);
      }
    } catch (err) {
      setErro(
        err instanceof ApiError && err.status === 403
          ? "Você não tem acesso a esta área."
          : "Não foi possível carregar as encomendas.",
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
    if (!unidadeId) return;
    setEnviando(true);
    setErro(null);
    try {
      await api.registrarEncomenda(unidadeId, descricao.trim() || undefined);
      setDescricao("");
      await carregar();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Não foi possível registrar a encomenda.");
    } finally {
      setEnviando(false);
    }
  }

  async function handleRetirada(id: string) {
    try {
      await api.retirarEncomenda(id);
      await carregar();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Não foi possível registrar a retirada.");
    }
  }

  const pendentes = encomendas.filter((e) => !e.retiradaEm);
  const retiradas = encomendas.filter((e) => e.retiradaEm);

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <img src="/icon-encomendas.jpg" alt="" className="h-12 w-12 rounded-lg border border-slate-200 object-contain" />
        <div>
          <h1 className="text-lg font-semibold">Encomendas</h1>
          <p className="text-sm text-slate-500">Controle de recebimento e retirada de encomendas.</p>
        </div>
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
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Descrição (opcional, ex: Caixa Amazon)"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={enviando}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {enviando ? "Registrando..." : "Registrar encomenda"}
          </button>
        </form>
      )}

      {erro && <p className="text-sm text-red-600">{erro}</p>}

      {carregando ? (
        <p className="text-sm text-slate-500">Carregando...</p>
      ) : (
        <div className="space-y-4">
          <div>
            <h2 className="mb-2 text-sm font-medium text-slate-700">Aguardando retirada</h2>
            <ul className="space-y-2">
              {pendentes.map((e) => (
                <li
                  key={e.id}
                  className="flex items-center justify-between rounded-md border border-slate-200 bg-white p-3"
                >
                  <div>
                    <p className="text-sm font-medium">{e.descricao ?? "Encomenda"}</p>
                    <p className="text-xs text-slate-400">
                      {e.unidadeIdentificacao} · recebida {formatarData(e.recebidaEm)} · registrado por{" "}
                      {e.registradoPorNome}
                    </p>
                  </div>
                  {podeRegistrar && (
                    <button
                      onClick={() => handleRetirada(e.id)}
                      className="text-sm text-slate-600 hover:text-slate-900"
                    >
                      Registrar retirada
                    </button>
                  )}
                </li>
              ))}
              {pendentes.length === 0 && (
                <li className="rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-400">
                  Nenhuma encomenda pendente.
                </li>
              )}
            </ul>
          </div>

          {retiradas.length > 0 && (
            <div>
              <h2 className="mb-2 text-sm font-medium text-slate-700">Histórico</h2>
              <ul className="space-y-2">
                {retiradas.map((e) => (
                  <li key={e.id} className="rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-500">
                    {e.descricao ?? "Encomenda"} · {e.unidadeIdentificacao} · retirada em{" "}
                    {formatarData(e.retiradaEm!)}
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
