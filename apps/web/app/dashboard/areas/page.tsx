"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ApiError, type AreaComum } from "@condo/shared";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { temPermissao } from "@/lib/permissions";

export default function AreasComunsPage() {
  const { usuario } = useAuth();
  const podeCriar = temPermissao(usuario, "AREAS_COMUNS", "gerenciar");

  const [areas, setAreas] = useState<AreaComum[]>([]);
  const [nome, setNome] = useState("");
  const [regras, setRegras] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  async function carregar() {
    setCarregando(true);
    try {
      setAreas(await api.listarAreasComuns());
    } catch (err) {
      setErro(
        err instanceof ApiError && err.status === 403
          ? "Você não tem acesso a esta área."
          : "Não foi possível carregar as áreas comuns.",
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
    if (!nome.trim()) return;
    setErro(null);
    try {
      await api.criarAreaComum(nome.trim(), regras.trim() || undefined);
      setNome("");
      setRegras("");
      await carregar();
    } catch {
      setErro("Não foi possível criar a área comum.");
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <img src="/icon-areas-comuns.jpg" alt="" className="h-12 w-12 rounded-lg border border-slate-200 object-contain" />
        <div>
          <h1 className="text-lg font-semibold">Áreas comuns</h1>
          <p className="text-sm text-slate-500">Espaços disponíveis para reserva.</p>
        </div>
      </div>

      {podeCriar && (
        <form onSubmit={handleSubmit} className="space-y-2 rounded-md border border-slate-200 bg-white p-4">
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Nome (ex: Salão de festas)"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
          <textarea
            value={regras}
            onChange={(e) => setRegras(e.target.value)}
            placeholder="Regras de uso (opcional)"
            rows={2}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            Adicionar área
          </button>
        </form>
      )}

      {erro && <p className="text-sm text-red-600">{erro}</p>}

      {carregando ? (
        <p className="text-sm text-slate-500">Carregando...</p>
      ) : (
        <ul className="space-y-3">
          {areas.map((area) => (
            <li key={area.id} className="rounded-md border border-slate-200 bg-white p-4">
              <h2 className="font-medium">{area.nome}</h2>
              {area.regras && <p className="mt-1 text-sm text-slate-600">{area.regras}</p>}
            </li>
          ))}
          {areas.length === 0 && (
            <li className="rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-400">
              Nenhuma área comum cadastrada.
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
