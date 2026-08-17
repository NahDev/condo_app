"use client";

import { useEffect, useState, type FormEvent } from "react";
import Image from "next/image";
import { ApiError, type Unidade } from "@condo/shared";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { temPermissao } from "@/lib/permissions";

const inputClass =
  "w-full rounded-md border border-light-border bg-light-card px-3 py-2 text-sm text-light-text placeholder:text-light-text-muted/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-dark-border dark:bg-dark-bg dark:text-dark-text dark:placeholder:text-dark-text-muted/70";

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
      <div className="flex items-center gap-3">
        <Image
          src="/icon-unidades.jpg"
          alt=""
          width={48}
          height={48}
          className="h-12 w-12 rounded-lg border border-light-border object-contain dark:border-dark-border"
        />
        <div>
          <h1 className="text-lg font-semibold">Unidades</h1>
          <p className="text-sm text-light-text-muted dark:text-dark-text-muted">
            Blocos e apartamentos do condomínio.
          </p>
        </div>
      </div>

      {podeGerenciar && (
        <form
          onSubmit={handleSubmit}
          className="space-y-2 rounded-md border border-light-border bg-light-card p-4 dark:border-dark-border dark:bg-dark-card"
        >
          <input
            value={bloco}
            onChange={(e) => setBloco(e.target.value)}
            placeholder="Bloco (ex: A)"
            className={inputClass}
          />
          <input
            value={apartamentos}
            onChange={(e) => setApartamentos(e.target.value)}
            placeholder="Apartamento(s) — um número ou vários separados por espaço (ex: 11 12 13 14)"
            className={inputClass}
          />
          <button
            type="submit"
            disabled={enviando}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {enviando ? "Adicionando..." : "Adicionar"}
          </button>
        </form>
      )}

      {mensagem && <p className="text-sm text-success">{mensagem}</p>}
      {erro && <p className="text-sm text-error">{erro}</p>}

      {carregando ? (
        <p className="text-sm text-light-text-muted dark:text-dark-text-muted">Carregando...</p>
      ) : (
        <ul className="divide-y divide-light-border rounded-md border border-light-border bg-light-card dark:divide-dark-border dark:border-dark-border dark:bg-dark-card">
          {unidades.map((u) => (
            <li key={u.id} className="px-4 py-3 text-sm">
              {u.identificacao}
            </li>
          ))}
          {unidades.length === 0 && (
            <li className="px-4 py-3 text-sm text-light-text-muted dark:text-dark-text-muted">
              Nenhuma unidade cadastrada.
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
