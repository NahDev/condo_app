"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { AreaComum, Reserva } from "@condo/shared";
import { ApiError } from "@condo/shared";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { temPermissao } from "@/lib/permissions";

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
      await carregar();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Não foi possível criar a reserva.");
    } finally {
      setEnviando(false);
    }
  }

  async function handleCancelar(id: string) {
    try {
      await api.cancelarReserva(id);
      await carregar();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Não foi possível cancelar a reserva.");
    }
  }

  const reservasAtivas = reservas.filter((r) => r.status === "CONFIRMADA");

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <img src="/icon-reservas.jpg" alt="" className="h-12 w-12 rounded-lg border border-slate-200 object-contain" />
        <div>
          <h1 className="text-lg font-semibold">Reservas</h1>
          <p className="text-sm text-slate-500">Agenda das áreas comuns do condomínio.</p>
        </div>
      </div>

      {!podeGerenciar ? null : areas.length === 0 && !carregando ? (
        <p className="text-sm text-slate-500">
          Nenhuma área comum cadastrada ainda. Peça ao síndico para cadastrar uma em
          &quot;Áreas comuns&quot;.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-2 rounded-md border border-slate-200 bg-white p-4">
          <select
            value={areaComumId}
            onChange={(e) => setAreaComumId(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
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
              className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
            <input
              type="datetime-local"
              value={fim}
              onChange={(e) => setFim(e.target.value)}
              required
              className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={enviando}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {enviando ? "Reservando..." : "Reservar"}
          </button>
        </form>
      )}

      {erro && <p className="text-sm text-red-600">{erro}</p>}

      {carregando ? (
        <p className="text-sm text-slate-500">Carregando...</p>
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
                className="flex items-center justify-between rounded-md border border-slate-200 bg-white p-4"
              >
                <div>
                  <h2 className="font-medium">{reserva.areaComumNome}</h2>
                  <p className="text-sm text-slate-600">{formatarPeriodo(reserva.inicio, reserva.fim)}</p>
                  <p className="text-xs text-slate-400">
                    {reserva.unidadeIdentificacao} · reservado por {reserva.criadoPorNome}
                  </p>
                </div>
                {podeCancelar && (
                  <button
                    onClick={() => handleCancelar(reserva.id)}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Cancelar
                  </button>
                )}
              </li>
            );
          })}
          {reservasAtivas.length === 0 && (
            <li className="rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-400">
              Nenhuma reserva ativa.
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
