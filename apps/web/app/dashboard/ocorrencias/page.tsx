"use client";

import { useEffect, useState, type FormEvent } from "react";
import Image from "next/image";
import type { Ocorrencia, StatusOcorrencia } from "@condo/shared";
import { ApiError } from "@condo/shared";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { temPermissao } from "@/lib/permissions";
import { FotoInput } from "@/components/FotoInput";
import { FotoThumb } from "@/components/FotoThumb";
import { EmptyState } from "@/components/EmptyState";
import { useToast } from "@/components/ToastProvider";

const inputClass =
  "w-full rounded-md border border-light-border bg-light-card px-3 py-2 text-sm text-light-text placeholder:text-light-text-muted/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-dark-border dark:bg-dark-bg dark:text-dark-text dark:placeholder:text-dark-text-muted/70";

const STATUS_LABEL: Record<StatusOcorrencia, string> = {
  ABERTA: "Aberta",
  EM_ANDAMENTO: "Em andamento",
  RESOLVIDA: "Resolvida",
};

const STATUS_COR: Record<StatusOcorrencia, string> = {
  ABERTA: "bg-warning/10 text-warning dark:bg-warning dark:text-warning-foreground",
  EM_ANDAMENTO: "bg-primary/10 text-primary dark:bg-primary dark:text-primary-foreground",
  RESOLVIDA: "bg-success/10 text-success dark:bg-success dark:text-success-foreground",
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
  const toast = useToast();
  const podeGerenciar = temPermissao(usuario, "OCORRENCIAS", "gerenciar");

  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [titulo, setTitulo] = useState("");
  const [categoria, setCategoria] = useState("");
  const [descricao, setDescricao] = useState("");
  const [foto, setFoto] = useState<File | null>(null);
  const [fotoResetKey, setFotoResetKey] = useState(0);
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
      await api.criarOcorrencia(
        titulo.trim(),
        descricao.trim(),
        categoria.trim() || undefined,
        foto ?? undefined,
      );
      setTitulo("");
      setCategoria("");
      setDescricao("");
      setFoto(null);
      setFotoResetKey((k) => k + 1);
      toast.sucesso("Chamado aberto.");
      await carregar();
    } catch (err) {
      toast.erro(err instanceof ApiError ? err.message : "Não foi possível abrir o chamado.");
    } finally {
      setEnviando(false);
    }
  }

  async function avancarStatus(id: string, status: StatusOcorrencia) {
    try {
      await api.atualizarStatusOcorrencia(id, status);
      toast.sucesso("Status atualizado.");
      await carregar();
    } catch (err) {
      toast.erro(err instanceof ApiError ? err.message : "Não foi possível atualizar o status.");
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Image
          src="/icon-ocorrencias.jpg"
          alt=""
          width={48}
          height={48}
          className="h-12 w-12 rounded-lg border border-light-border object-contain dark:border-dark-border"
        />
        <div>
          <h1 className="text-lg font-semibold">Ocorrências</h1>
          <p className="text-sm text-light-text-muted dark:text-dark-text-muted">
            Abra e acompanhe chamados do condomínio.
          </p>
        </div>
      </div>

      {podeGerenciar && (
        <form
          onSubmit={handleSubmit}
          className="space-y-2 rounded-md border border-light-border bg-light-card p-4 dark:border-dark-border dark:bg-dark-card"
        >
          <input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Título (ex: Vazamento na garagem)"
            className={inputClass}
          />
          <input
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            placeholder="Categoria (opcional, ex: Hidráulica)"
            className={inputClass}
          />
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Descreva o problema..."
            rows={3}
            className={inputClass}
          />
          <FotoInput onChange={setFoto} resetKey={fotoResetKey} />
          <button
            type="submit"
            disabled={enviando}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {enviando ? "Abrindo..." : "Abrir chamado"}
          </button>
        </form>
      )}

      {erro && <p className="text-sm text-error">{erro}</p>}

      {carregando ? (
        <p className="text-sm text-light-text-muted dark:text-dark-text-muted">Carregando...</p>
      ) : (
        <ul className="space-y-3">
          {ocorrencias.map((oc) => {
            const proximo = podeGerenciar ? PROXIMO_STATUS[oc.status] : undefined;
            return (
              <li
                key={oc.id}
                className="rounded-md border border-light-border bg-light-card p-4 dark:border-dark-border dark:bg-dark-card"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="font-medium">{oc.titulo}</h2>
                    {oc.categoria && (
                      <p className="text-xs text-light-text-muted dark:text-dark-text-muted">
                        {oc.categoria}
                      </p>
                    )}
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COR[oc.status]}`}>
                    {STATUS_LABEL[oc.status]}
                  </span>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm text-light-text-muted dark:text-dark-text-muted">
                  {oc.descricao}
                </p>
                {oc.fotoUrl && <FotoThumb fotoUrl={oc.fotoUrl} alt={oc.titulo} />}
                <p className="mt-2 text-xs text-light-text-muted dark:text-dark-text-muted">
                  {oc.unidadeIdentificacao ?? "sem unidade"} · aberto por {oc.criadoPorNome} em{" "}
                  {formatarData(oc.createdAt)}
                </p>
                {proximo && (
                  <button
                    onClick={() => avancarStatus(oc.id, proximo.status)}
                    className="mt-3 text-sm text-light-text underline hover:text-primary dark:text-dark-text dark:hover:text-primary"
                  >
                    {proximo.label}
                  </button>
                )}
              </li>
            );
          })}
          {ocorrencias.length === 0 && (
            <li>
              <EmptyState
                icone="/icon-ocorrencias.jpg"
                titulo="Nenhuma ocorrência registrada."
                podeCriar={podeGerenciar}
                dicaCriacao="Use o formulário acima para abrir o primeiro chamado."
              />
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
