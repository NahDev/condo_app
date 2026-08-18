"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

type TipoToast = "success" | "error";

interface ToastItem {
  id: number;
  tipo: TipoToast;
  mensagem: string;
}

interface ToastContextValue {
  sucesso: (mensagem: string) => void;
  erro: (mensagem: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

let proximoId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const remover = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const adicionar = useCallback(
    (tipo: TipoToast, mensagem: string) => {
      const id = proximoId++;
      setToasts((prev) => [...prev, { id, tipo, mensagem }]);
      setTimeout(() => remover(id), 4000);
    },
    [remover],
  );

  const value: ToastContextValue = {
    sucesso: (mensagem) => adicionar("success", mensagem),
    erro: (mensagem) => adicionar("error", mensagem),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto flex items-start gap-3 rounded-md border px-4 py-3 text-sm shadow-lg ${
              t.tipo === "success"
                ? "border-success/20 bg-light-card text-success dark:border-success/40 dark:bg-dark-card"
                : "border-error/20 bg-light-card text-error dark:border-error/40 dark:bg-dark-card"
            }`}
          >
            <span className="flex-1">{t.mensagem}</span>
            <button
              type="button"
              onClick={() => remover(t.id)}
              aria-label="Fechar"
              className="shrink-0 text-light-text-muted opacity-70 hover:opacity-100 dark:text-dark-text-muted"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast deve ser usado dentro de ToastProvider");
  return ctx;
}
