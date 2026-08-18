"use client";

import { useEffect, useState, type FormEvent } from "react";
import Image from "next/image";
import type { AreaComum, Reserva } from "@condo/shared";
import { ApiError } from "@condo/shared";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { temPermissao } from "@/lib/permissions";
import { EmptyState } from "@/components/EmptyState";
import { useToast } from "@/components/ToastProvider";
import { useConfirm } from "@/components/ConfirmProvider";

const inputClass =
  "rounded-md border border-light-border bg-light-card px-3 py-2 text-sm text-light-text placeholder:text-light-text-muted/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-dark-border dark:bg-dark-bg dark:text-dark-text dark:placeholder:text-dark-text-muted/70";

function formatarPeriodo(inicio: string, fim: string) {
  const opts: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  };
  return `${new Date(inicio).toLocaleString("pt-BR", opts)} — ${new Date(fim).toLocaleString("pt-BR", opts)}`;
}

export default function ReservasPage() {
  const { usuario } = useAuth();
  const toast = useToast();
  const confirmar = useConfirm();
  const podeGerenciar = temPermissao(usuario, "RESERVAS", "gerenciar");

  const [areas, setAreas] = useState<AreaComum[]>([]);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [areaComumId, setAreaComumId] = useState("");
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function carregar() {
    setCarregando(true);
    try {
      const [areasResp, reservasResp] = await Promise.all([
        api.listarAreasComuns(),
        api.listarReservas(),
      ]);
      setAreas(areasResp);
      setReservas(reservasResp);
      if (!areaComumId && areasResp.length > 0) {
        setAreaComumId(areasResp[0]!.id);
      }
    } catch (err) {
      setErro(
        err instanceof ApiError && err.status === 403
          ? "Você não tem acesso a esta área."
          : "Não foi possível carregar as reservas.",
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
    if (!areaComumId || !inicio || !fim) return;
    setErro(null);
    setEnviando(true);
    try {
      await api.criarReserva(
        areaComumId,
        new Date(inicio).toISOString(),
        new Date(fim).toISOString(),
      );
      setInicio("");
      setFim("");
      toast.sucesso("Reserva confirmada.");
      await carregar();
    } catch (err) {
      toast.erro(err instanceof ApiError ? err.message : "Não foi possível criar a reserva.");
    } finally {
      setEnviando(false);
    }
  }

  async function handleCancelar(id: string) {
    const ok = await confirmar({
      titulo: "Cancelar esta reserva?",
      descricao: "O horário fica disponível novamente para outros moradores. Essa ação não pode ser desfeita.",
      confirmarLabel: "Cancelar reserva",
      cancelarLabel: "Voltar",
      perigoso: true,
    });
    if (!ok) return;

    try {
      await api.cancelarReserva(id);
      toast.sucesso("Reserva cancelada.");
      await carregar();
    } catch (err) {
      toast.erro(err instanceof ApiError ? err.message : "Não foi possível cancelar a reserva.");
    }
  }

  const reservasAtivas = reservas.filter((r) => r.status === "CONFIRMADA");

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Image
          src="/icon-reservas.jpg"
          alt=""
          width={48}
          height={48}
          className="h-12 w-12 rounded-lg border border-light-border object-contain dark:border-dark-border"
        />
        <div>
          <h1 className="text-lg font-semibold">Reservas</h1>
          <p className="text-sm text-light-text-muted dark:text-dark-text-muted">
            Agenda das áreas comuns do condomínio.
          </p>
        </div>
      </div>

      {!podeGerenciar ? null : areas.length === 0 && !carregando ? (
        <p className="text-sm text-light-text-muted dark:text-dark-text-muted">
          Nenhuma área comum cadastrada ainda. Peça ao síndico para cadastrar uma em
          &quot;Áreas comuns&quot;.
        </p>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="space-y-2 rounded-md border border-light-border bg-light-card p-4 dark:border-dark-border dark:bg-dark-card"
        >
          <select
            value={areaComumId}
            onChange={(e) => setAreaComumId(e.target.value)}
            className={`w-full ${inputClass}`}
          >
            {areas.map((area) => (
              <option key={area.id} value={area.id}>
                {area.nome}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <input
              type="datetime-local"
              value={inicio}
              onChange={(e) => setInicio(e.target.value)}
              required
              className={`flex-1 ${inputClass}`}
            />
            <input
              type="datetime-local"
              value={fim}
              onChange={(e) => setFim(e.target.value)}
              required
              className={`flex-1 ${inputClass}`}
            />
          </div>
          <button
            type="submit"
            disabled={enviando}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {enviando ? "Reservando..." : "Reservar"}
          </button>
        </form>
      )}

      {erro && <p className="text-sm text-error">{erro}</p>}

      {carregando ? (
        <p className="text-sm text-light-text-muted dark:text-dark-text-muted">Carregando...</p>
      ) : (
        <ul className="space-y-3">
          {reservasAtivas.map((reserva) => {
            const podeCancelar =
              podeGerenciar &&
              (reserva.criadoPorId === usuario?.id ||
                usuario?.papel === "SINDICO" ||
                usuario?.papel === "ADMIN");
            return (
              <li
                key={reserva.id}
                className="flex items-center justify-between rounded-md border border-light-border bg-light-card p-4 dark:border-dark-border dark:bg-dark-card"
              >
                <div>
                  <h2 className="font-medium">{reserva.areaComumNome}</h2>
                  <p className="text-sm text-light-text-muted dark:text-dark-text-muted">
                    {formatarPeriodo(reserva.inicio, reserva.fim)}
                  </p>
                  <p className="text-xs text-light-text-muted dark:text-dark-text-muted">
                    {reserva.unidadeIdentificacao} · reservado por {reserva.criadoPorNome}
                  </p>
                </div>
                {podeCancelar && (
                  <button
                    onClick={() => handleCancelar(reserva.id)}
                    className="text-sm text-error hover:text-error/80"
                  >
                    Cancelar
                  </button>
                )}
              </li>
            );
          })}
          {reservasAtivas.length === 0 && (
            <li>
              <EmptyState
                icone="/icon-reservas.jpg"
                titulo="Nenhuma reserva ativa."
                podeCriar={podeGerenciar}
                dicaCriacao="Use o formulário acima para reservar uma área comum."
              />
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
