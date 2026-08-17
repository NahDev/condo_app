"use client";

import { useEffect, useState, type FormEvent } from "react";
import Image from "next/image";
import type { Unidade, Visitante } from "@condo/shared";
import { ApiError } from "@condo/shared";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { temPermissao } from "@/lib/permissions";

const inputClass =
  "w-full rounded-md border border-light-border bg-light-card px-3 py-2 text-sm text-light-text placeholder:text-light-text-muted/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-dark-border dark:bg-dark-bg dark:text-dark-text dark:placeholder:text-dark-text-muted/70";

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
      <div className="flex items-center gap-3">
        <Image
          src="/icon-visitantes.jpg"
          alt=""
          width={48}
          height={48}
          className="h-12 w-12 rounded-lg border border-light-border object-contain dark:border-dark-border"
        />
        <div>
          <h1 className="text-lg font-semibold">Visitantes</h1>
          <p className="text-sm text-light-text-muted dark:text-dark-text-muted">
            Controle de entrada e saída de visitantes.
          </p>
        </div>
      </div>

      {podeRegistrar && (
        <form
          onSubmit={handleSubmit}
          className="space-y-2 rounded-md border border-light-border bg-light-card p-4 dark:border-dark-border dark:bg-dark-card"
        >
          <select
            value={unidadeId}
            onChange={(e) => setUnidadeId(e.target.value)}
            className={inputClass}
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
            className={inputClass}
          />
          <input
            value={documento}
            onChange={(e) => setDocumento(e.target.value)}
            placeholder="Documento (opcional)"
            className={inputClass}
          />
          <button
            type="submit"
            disabled={enviando}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {enviando ? "Registrando..." : "Registrar entrada"}
          </button>
        </form>
      )}

      {erro && <p className="text-sm text-error">{erro}</p>}

      {carregando ? (
        <p className="text-sm text-light-text-muted dark:text-dark-text-muted">Carregando...</p>
      ) : (
        <div className="space-y-4">
          <div>
            <h2 className="mb-2 text-sm font-medium text-light-text dark:text-dark-text">
              No condomínio agora
            </h2>
            <ul className="space-y-2">
              {dentroDoCondominio.map((v) => (
                <li
                  key={v.id}
                  className="flex items-center justify-between rounded-md border border-light-border bg-light-card p-3 dark:border-dark-border dark:bg-dark-card"
                >
                  <div>
                    <p className="text-sm font-medium">{v.nome}</p>
                    <p className="text-xs text-light-text-muted dark:text-dark-text-muted">
                      {v.unidadeIdentificacao} · entrou {formatarData(v.entrada)} · registrado por{" "}
                      {v.registradoPorNome}
                    </p>
                  </div>
                  {podeRegistrar && (
                    <button
                      onClick={() => handleSaida(v.id)}
                      className="text-sm text-light-text-muted hover:text-light-text dark:text-dark-text-muted dark:hover:text-dark-text"
                    >
                      Registrar saída
                    </button>
                  )}
                </li>
              ))}
              {dentroDoCondominio.length === 0 && (
                <li className="rounded-md border border-light-border bg-light-card p-3 text-sm text-light-text-muted dark:border-dark-border dark:bg-dark-card dark:text-dark-text-muted">
                  Nenhum visitante no condomínio.
                </li>
              )}
            </ul>
          </div>

          {jaSairam.length > 0 && (
            <div>
              <h2 className="mb-2 text-sm font-medium text-light-text dark:text-dark-text">
                Histórico
              </h2>
              <ul className="space-y-2">
                {jaSairam.map((v) => (
                  <li
                    key={v.id}
                    className="rounded-md border border-light-border bg-light-card p-3 text-sm text-light-text-muted dark:border-dark-border dark:bg-dark-card dark:text-dark-text-muted"
                  >
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
