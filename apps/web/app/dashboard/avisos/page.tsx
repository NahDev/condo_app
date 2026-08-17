"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ApiError, type Aviso } from "@condo/shared";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { temPermissao } from "@/lib/permissions";

function formatarData(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AvisosPage() {
  const { usuario } = useAuth();
  const podeCriar = temPermissao(usuario, "AVISOS", "gerenciar");

  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [titulo, setTitulo] = useState("");
  const [corpo, setCorpo] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function carregar() {
    setCarregando(true);
    try {
      setAvisos(await api.listarAvisos());
    } catch (err) {
      setErro(
        err instanceof ApiError && err.status === 403
          ? "Você não tem acesso a esta área."
          : "Não foi possível carregar os avisos.",
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
    if (!titulo.trim() || !corpo.trim()) return;
    setEnviando(true);
    try {
      await api.criarAviso(titulo.trim(), corpo.trim());
      setTitulo("");
      setCorpo("");
      await carregar();
    } catch {
      setErro("Não foi possível publicar o aviso.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <img src="/icon-avisos.jpg" alt="" className="h-12 w-12 rounded-lg border border-slate-200 object-contain" />
        <div>
          <h1 className="text-lg font-semibold">Avisos</h1>
          <p className="text-sm text-slate-500">Mural de comunicados do condomínio.</p>
        </div>
      </div>

      {podeCriar && (
        <form onSubmit={handleSubmit} className="space-y-2 rounded-md border border-slate-200 bg-white p-4">
          <input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Título do aviso"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
          <textarea
            value={corpo}
            onChange={(e) => setCorpo(e.target.value)}
            placeholder="Escreva o comunicado..."
            rows={3}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={enviando}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {enviando ? "Publicando..." : "Publicar aviso"}
          </button>
        </form>
      )}

      {erro && <p className="text-sm text-red-600">{erro}</p>}

      {carregando ? (
        <p className="text-sm text-slate-500">Carregando...</p>
      ) : (
        <ul className="space-y-3">
          {avisos.map((aviso) => (
            <li key={aviso.id} className="rounded-md border border-slate-200 bg-white p-4">
              <div className="flex items-baseline justify-between">
                <h2 className="font-medium">{aviso.titulo}</h2>
                <span className="text-xs text-slate-400">{formatarData(aviso.createdAt)}</span>
              </div>
              <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{aviso.corpo}</p>
              <p className="mt-2 text-xs text-slate-400">por {aviso.autorNome}</p>
            </li>
          ))}
          {avisos.length === 0 && (
            <li className="rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-400">
              Nenhum aviso publicado ainda.
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
