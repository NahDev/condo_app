"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

interface ConfirmOptions {
  titulo: string;
  descricao?: string;
  confirmarLabel?: string;
  cancelarLabel?: string;
  perigoso?: boolean;
}

interface PedidoConfirmacao extends ConfirmOptions {
  resolve: (valor: boolean) => void;
}

const ConfirmContext = createContext<((opts: ConfirmOptions) => Promise<boolean>) | undefined>(
  undefined,
);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pedido, setPedido] = useState<PedidoConfirmacao | null>(null);

  const confirmar = useCallback((opts: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setPedido({ ...opts, resolve });
    });
  }, []);

  function responder(valor: boolean) {
    pedido?.resolve(valor);
    setPedido(null);
  }

  return (
    <ConfirmContext.Provider value={confirmar}>
      {children}
      {pedido && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm rounded-lg border border-light-border bg-light-card p-5 shadow-lg dark:border-dark-border dark:bg-dark-card">
            <h2 className="text-base font-semibold text-light-text dark:text-dark-text">
              {pedido.titulo}
            </h2>
            {pedido.descricao && (
              <p className="mt-2 text-sm text-light-text-muted dark:text-dark-text-muted">
                {pedido.descricao}
              </p>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => responder(false)}
                className="rounded-md px-3 py-2 text-sm font-medium text-light-text-muted hover:bg-light-bg-muted dark:text-dark-text-muted dark:hover:bg-dark-bg-muted"
              >
                {pedido.cancelarLabel ?? "Cancelar"}
              </button>
              <button
                type="button"
                onClick={() => responder(true)}
                className={`rounded-md px-3 py-2 text-sm font-medium ${
                  pedido.perigoso
                    ? "bg-error text-error-foreground hover:bg-error/90"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                }`}
              >
                {pedido.confirmarLabel ?? "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm deve ser usado dentro de ConfirmProvider");
  return ctx;
}
