"use client";

import { useEffect, useState, type FormEvent } from "react";
import Image from "next/image";
import type { Encomenda, Unidade } from "@condo/shared";
import { ApiError } from "@condo/shared";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { temPermissao } from "@/lib/permissions";
import { FotoInput } from "@/components/FotoInput";
import { FotoThumb } from "@/components/FotoThumb";

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

export default function EncomendasPage() {
  const { usuario } = useAuth();
  const podeRegistrar = temPermissao(usuario, "ENCOMENDAS", "gerenciar");

  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [encomendas, setEncomendas] = useState<Encomenda[]>([]);
  const [unidadeId, setUnidadeId] = useState("");
  const [descricao, setDescricao] = useState("");
  const [foto, setFoto] = useState<File | null>(null);
  const [fotoResetKey, setFotoResetKey] = useState(0);
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
      await api.registrarEncomenda(unidadeId, descricao.trim() || undefined, foto ?? undefined);
      setDescricao("");
      setFoto(null);
      setFotoResetKey((k) => k + 1);
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
        <Image
          src="/icon-encomendas.jpg"
          alt=""
          width={48}
          height={48}
          className="h-12 w-12 rounded-lg border border-light-border object-contain dark:border-dark-border"
        />
        <div>
          <h1 className="text-lg font-semibold">Encomendas</h1>
          <p className="text-sm text-light-text-muted dark:text-dark-text-muted">
            Controle de recebimento e retirada de encomendas.
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
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Descrição (opcional, ex: Caixa Amazon)"
            className={inputClass}
          />
          <FotoInput onChange={setFoto} resetKey={fotoResetKey} />
          <button
            type="submit"
            disabled={enviando}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {enviando ? "Registrando..." : "Registrar encomenda"}
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
              Aguardando retirada
            </h2>
            <ul className="space-y-2">
              {pendentes.map((e) => (
                <li
                  key={e.id}
                  className="rounded-md border border-light-border bg-light-card p-3 dark:border-dark-border dark:bg-dark-card"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{e.descricao ?? "Encomenda"}</p>
                      <p className="text-xs text-light-text-muted dark:text-dark-text-muted">
                        {e.unidadeIdentificacao} · recebida {formatarData(e.recebidaEm)} · registrado por{" "}
                        {e.registradoPorNome}
                      </p>
                    </div>
                    {podeRegistrar && (
                      <button
                        onClick={() => handleRetirada(e.id)}
                        className="text-sm text-light-text-muted hover:text-light-text dark:text-dark-text-muted dark:hover:text-dark-text"
                      >
                        Registrar retirada
                      </button>
                    )}
                  </div>
                  {e.fotoUrl && <FotoThumb fotoUrl={e.fotoUrl} alt={e.descricao ?? "Encomenda"} />}
                </li>
              ))}
              {pendentes.length === 0 && (
                <li className="rounded-md border border-light-border bg-light-card p-3 text-sm text-light-text-muted dark:border-dark-border dark:bg-dark-card dark:text-dark-text-muted">
                  Nenhuma encomenda pendente.
                </li>
              )}
            </ul>
          </div>

          {retiradas.length > 0 && (
            <div>
              <h2 className="mb-2 text-sm font-medium text-light-text dark:text-dark-text">
                Histórico
              </h2>
              <ul className="space-y-2">
                {retiradas.map((e) => (
                  <li
                    key={e.id}
                    className="rounded-md border border-light-border bg-light-card p-3 text-sm text-light-text-muted dark:border-dark-border dark:bg-dark-card dark:text-dark-text-muted"
                  >
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
