"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ApiError, type Unidade } from "@condo/shared";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { temPermissao } from "@/lib/permissions";

export default function UnidadesPage() {
  const { usuario } = useAuth();
  const podeGerenciar = temPermissao(usuario, "UNIDADES", "gerenciar");

  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [bloco, setBloco] = useState("");
  const [apartamentos, setApartamentos] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<string | null>(null);

  async function carregar() {
    setCarregando(true);
    try {
      setUnidades(await api.listarUnidades());
    } catch (err) {
      setErro(
        err instanceof ApiError && err.status === 403
          ? "Você não tem acesso a esta área."
          : "Não foi possível carregar as unidades.",
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
    const numeros = apartamentos.trim().split(/\s+/).filter(Boolean);
    if (!bloco.trim() || numeros.length === 0) return;

    setEnviando(true);
    setErro(null);
    setMensagem(null);
    try {
      const identificacoes = numeros.map((numero) => `Bloco ${bloco.trim()} - Apto ${numero}`);
      const resposta = await api.criarUnidadesLote(identificacoes);
      setApartamentos("");

      const partes: string[] = [];
      if (resposta.criadas.length > 0) {
        partes.push(
          `${resposta.criadas.length} ${resposta.criadas.length === 1 ? "unidade criada" : "unidades criadas"}`,
        );
      }
      if (resposta.duplicadas.length > 0) {
        partes.push(
          `${resposta.duplicadas.length} já ${resposta.duplicadas.length === 1 ? "existia" : "existiam"}`,
        );
      }
      setMensagem(partes.join(" · "));
      await carregar();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Não foi possível adicionar as unidades.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Unidades</h1>
        <p className="text-sm text-slate-500">Blocos e apartamentos do condomínio.</p>
      </div>

      {podeGerenciar && (
        <form onSubmit={handleSubmit} className="space-y-2 rounded-md border border-slate-200 bg-white p-4">
          <input
            value={bloco}
            onChange={(e) => setBloco(e.target.value)}
            placeholder="Bloco (ex: A)"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
          <input
            value={apartamentos}
            onChange={(e) => setApartamentos(e.target.value)}
            placeholder="Apartamento(s) — um número ou vários separados por espaço (ex: 11 12 13 14)"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={enviando}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {enviando ? "Adicionando..." : "Adicionar"}
          </button>
        </form>
      )}

      {mensagem && <p className="text-sm text-green-700">{mensagem}</p>}
      {erro && <p className="text-sm text-red-600">{erro}</p>}

      {carregando ? (
        <p className="text-sm text-slate-500">Carregando...</p>
      ) : (
        <ul className="divide-y divide-slate-200 rounded-md border border-slate-200 bg-white">
          {unidades.map((u) => (
            <li key={u.id} className="px-4 py-3 text-sm">
              {u.identificacao}
            </li>
          ))}
          {unidades.length === 0 && (
            <li className="px-4 py-3 text-sm text-slate-400">Nenhuma unidade cadastrada.</li>
          )}
        </ul>
      )}
    </div>
  );
}
