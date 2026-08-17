"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";

const linkClass =
  "block rounded-md px-3 py-2 text-light-text dark:text-dark-text hover:bg-light-bg-muted dark:hover:bg-dark-bg-muted transition-colors";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { usuario, carregando, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!carregando && !usuario) {
      router.push("/login");
    }
  }, [carregando, usuario, router]);

  if (carregando || !usuario) {
    return <div className="p-8 text-sm text-light-text-muted dark:text-dark-text-muted">Carregando...</div>;
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 shrink-0 border-r border-light-border bg-light-card p-4 dark:border-dark-border dark:bg-dark-card">
        <Logo className="mb-6" />
        <nav className="space-y-1 text-sm">
          <a href="/dashboard/avisos" className={linkClass}>
            Avisos
          </a>
          <a href="/dashboard/unidades" className={linkClass}>
            Unidades
          </a>
          <a href="/dashboard/areas" className={linkClass}>
            Áreas comuns
          </a>
          <a href="/dashboard/reservas" className={linkClass}>
            Reservas
          </a>
          <a href="/dashboard/ocorrencias" className={linkClass}>
            Ocorrências
          </a>
          <a href="/dashboard/visitantes" className={linkClass}>
            Visitantes
          </a>
          <a href="/dashboard/encomendas" className={linkClass}>
            Encomendas
          </a>
          {(usuario.papel === "SINDICO" || usuario.papel === "ADMIN") && (
            <a href="/dashboard/usuarios" className={linkClass}>
              Usuários
            </a>
          )}
        </nav>
      </aside>
      <div className="flex-1">
        <header className="flex items-center justify-between border-b border-light-border bg-light-card px-6 py-3 dark:border-dark-border dark:bg-dark-card">
          <div className="text-sm">
            <p className="font-medium text-light-text dark:text-dark-text">{usuario.nome}</p>
            <p className="text-light-text-muted dark:text-dark-text-muted">{usuario.papel}</p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={logout}
              className="text-sm text-light-text-muted hover:text-light-text dark:text-dark-text-muted dark:hover:text-dark-text"
            >
              Sair
            </button>
          </div>
        </header>
        <main className="bg-light-bg-muted p-6 dark:bg-dark-bg">{children}</main>
      </div>
    </div>
  );
}
