"use client";

import { useEffect, useState, type FormEvent } from "react";
import Image from "next/image";
import { ApiError, type Aviso } from "@condo/shared";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { temPermissao } from "@/lib/permissions";
import { FotoInput } from "@/components/FotoInput";
import { FotoThumb } from "@/components/FotoThumb";
import { EmptyState } from "@/components/EmptyState";
import { useToast } from "@/components/ToastProvider";

const inputClass =
  "w-full rounded-md border border-light-border bg-light-card px-3 py-2 text-sm text-light-text placeholder:text-light-text-muted/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-dark-border dark:bg-dark-bg dark:text-dark-text dark:placeholder:text-dark-text-muted/70";

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
  const toast = useToast();
  const podeCriar = temPermissao(usuario, "AVISOS", "gerenciar");

  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [titulo, setTitulo] = useState("");
  const [corpo, setCorpo] = useState("");
  const [foto, setFoto] = useState<File | null>(null);
  const [fotoResetKey, setFotoResetKey] = useState(0);
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
      await api.criarAviso(titulo.trim(), corpo.trim(), foto ?? undefined);
      setTitulo("");
      setCorpo("");
      setFoto(null);
      setFotoResetKey((k) => k + 1);
      toast.sucesso("Aviso publicado.");
      await carregar();
    } catch {
      toast.erro("Não foi possível publicar o aviso.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Image
          src="/icon-avisos.jpg"
          alt=""
          width={48}
          height={48}
          className="h-12 w-12 rounded-lg border border-light-border object-contain dark:border-dark-border"
        />
        <div>
          <h1 className="text-lg font-semibold">Avisos</h1>
          <p className="text-sm text-light-text-muted dark:text-dark-text-muted">
            Mural de comunicados do condomínio.
          </p>
        </div>
      </div>

      {podeCriar && (
        <form
          onSubmit={handleSubmit}
          className="space-y-2 rounded-md border border-light-border bg-light-card p-4 dark:border-dark-border dark:bg-dark-card"
        >
          <input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Título do aviso"
            className={inputClass}
          />
          <textarea
            value={corpo}
            onChange={(e) => setCorpo(e.target.value)}
            placeholder="Escreva o comunicado..."
            rows={3}
            className={inputClass}
          />
          <FotoInput onChange={setFoto} resetKey={fotoResetKey} />
          <button
            type="submit"
            disabled={enviando}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {enviando ? "Publicando..." : "Publicar aviso"}
          </button>
        </form>
      )}

      {erro && <p className="text-sm text-error">{erro}</p>}

      {carregando ? (
        <p className="text-sm text-light-text-muted dark:text-dark-text-muted">Carregando...</p>
      ) : (
        <ul className="space-y-3">
          {avisos.map((aviso) => (
            <li
              key={aviso.id}
              className="rounded-md border border-light-border bg-light-card p-4 dark:border-dark-border dark:bg-dark-card"
            >
              <div className="flex items-baseline justify-between">
                <h2 className="font-medium">{aviso.titulo}</h2>
                <span className="text-xs text-light-text-muted dark:text-dark-text-muted">
                  {formatarData(aviso.createdAt)}
                </span>
              </div>
              <p className="mt-1 whitespace-pre-wrap text-sm text-light-text-muted dark:text-dark-text-muted">
                {aviso.corpo}
              </p>
              {aviso.fotoUrl && <FotoThumb fotoUrl={aviso.fotoUrl} alt={aviso.titulo} />}
              <p className="mt-2 text-xs text-light-text-muted dark:text-dark-text-muted">
                por {aviso.autorNome}
              </p>
            </li>
          ))}
          {avisos.length === 0 && (
            <li>
              <EmptyState
                icone="/icon-avisos.jpg"
                titulo="Nenhum aviso publicado ainda."
                podeCriar={podeCriar}
                dicaCriacao="Use o formulário acima para publicar o primeiro comunicado."
              />
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
