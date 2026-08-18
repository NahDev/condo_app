"use client";

import { useEffect, useState, type FormEvent } from "react";
import Image from "next/image";
import { ApiError, type AreaComum } from "@condo/shared";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { temPermissao } from "@/lib/permissions";
import { EmptyState } from "@/components/EmptyState";
import { ListSkeleton } from "@/components/Skeleton";
import { useToast } from "@/components/ToastProvider";

const inputClass =
  "w-full rounded-md border border-light-border bg-light-card px-3 py-2 text-sm text-light-text placeholder:text-light-text-muted/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-dark-border dark:bg-dark-bg dark:text-dark-text dark:placeholder:text-dark-text-muted/70";

export default function AreasComunsPage() {
  const { usuario } = useAuth();
  const toast = useToast();
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
      toast.sucesso("Área comum cadastrada.");
      await carregar();
    } catch {
      toast.erro("Não foi possível criar a área comum.");
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Image
          src="/icon-areas-comuns.jpg"
          alt=""
          width={48}
          height={48}
          className="h-12 w-12 rounded-lg border border-light-border object-contain dark:border-dark-border"
        />
        <div>
          <h1 className="text-lg font-semibold">Áreas comuns</h1>
          <p className="text-sm text-light-text-muted dark:text-dark-text-muted">
            Espaços disponíveis para reserva.
          </p>
        </div>
      </div>

      {podeCriar && (
        <form
          onSubmit={handleSubmit}
          className="space-y-2 rounded-md border border-light-border bg-light-card p-4 dark:border-dark-border dark:bg-dark-card"
        >
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Nome (ex: Salão de festas)"
            className={inputClass}
          />
          <textarea
            value={regras}
            onChange={(e) => setRegras(e.target.value)}
            placeholder="Regras de uso (opcional)"
            rows={2}
            className={inputClass}
          />
          <button
            type="submit"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Adicionar área
          </button>
        </form>
      )}

      {erro && <p className="text-sm text-error">{erro}</p>}

      {carregando ? (
        <ListSkeleton />
      ) : (
        <ul className="space-y-3">
          {areas.map((area) => (
            <li
              key={area.id}
              className="rounded-md border border-light-border bg-light-card p-4 dark:border-dark-border dark:bg-dark-card"
            >
              <h2 className="font-medium">{area.nome}</h2>
              {area.regras && (
                <p className="mt-1 text-sm text-light-text-muted dark:text-dark-text-muted">
                  {area.regras}
                </p>
              )}
            </li>
          ))}
          {areas.length === 0 && (
            <li>
              <EmptyState
                icone="/icon-areas-comuns.jpg"
                titulo="Nenhuma área comum cadastrada."
                podeCriar={podeCriar}
                dicaCriacao="Use o formulário acima para cadastrar a primeira área."
              />
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
