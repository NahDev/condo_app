"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";

const NAV_ITEMS = [
  { href: "/dashboard/avisos", label: "Avisos" },
  { href: "/dashboard/unidades", label: "Unidades" },
  { href: "/dashboard/areas", label: "Áreas comuns" },
  { href: "/dashboard/reservas", label: "Reservas" },
  { href: "/dashboard/ocorrencias", label: "Ocorrências" },
  { href: "/dashboard/visitantes", label: "Visitantes" },
  { href: "/dashboard/encomendas", label: "Encomendas" },
];

const linkBase = "block rounded-md px-3 py-2 text-sm transition-colors";
const linkInativo =
  "text-light-text hover:bg-light-bg-muted dark:text-dark-text dark:hover:bg-dark-bg-muted";
const linkAtivo = "bg-primary font-medium text-primary-foreground";

function NavLink({
  href,
  label,
  pathname,
  onClick,
}: {
  href: string;
  label: string;
  pathname: string;
  onClick?: () => void;
}) {
  const ativo = pathname === href;
  return (
    <Link href={href} onClick={onClick} className={`${linkBase} ${ativo ? linkAtivo : linkInativo}`}>
      {label}
    </Link>
  );
}

function IconMenu({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function IconFechar({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { usuario, carregando, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [menuAberto, setMenuAberto] = useState(false);

  useEffect(() => {
    if (!carregando && !usuario) {
      router.push("/login");
    }
  }, [carregando, usuario, router]);

  useEffect(() => {
    setMenuAberto(false);
  }, [pathname]);

  if (carregando || !usuario) {
    return <div className="p-8 text-sm text-light-text-muted dark:text-dark-text-muted">Carregando...</div>;
  }

  return (
    <div className="flex min-h-screen">
      {menuAberto && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setMenuAberto(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 shrink-0 transform border-r border-light-border bg-light-card p-4 transition-transform duration-200 dark:border-dark-border dark:bg-dark-card md:relative md:translate-x-0 md:transition-none ${
          menuAberto ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-6 flex items-center justify-between">
          <Link href="/dashboard">
            <Logo />
          </Link>
          <button
            type="button"
            onClick={() => setMenuAberto(false)}
            aria-label="Fechar menu"
            className="text-light-text-muted hover:text-light-text dark:text-dark-text-muted dark:hover:text-dark-text md:hidden"
          >
            <IconFechar className="h-5 w-5" />
          </button>
        </div>
        <nav className="space-y-1 text-sm">
          <NavLink href="/dashboard" label="Início" pathname={pathname} />
          <div className="my-2 border-t border-light-border dark:border-dark-border" />
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.href} {...item} pathname={pathname} />
          ))}
          {(usuario.papel === "SINDICO" || usuario.papel === "ADMIN") && (
            <NavLink href="/dashboard/usuarios" label="Usuários" pathname={pathname} />
          )}
        </nav>
      </aside>

      <div className="flex-1">
        <header className="flex items-center justify-between border-b border-light-border bg-light-card px-4 py-3 dark:border-dark-border dark:bg-dark-card md:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMenuAberto(true)}
              aria-label="Abrir menu"
              className="text-light-text-muted hover:text-light-text dark:text-dark-text-muted dark:hover:text-dark-text md:hidden"
            >
              <IconMenu className="h-5 w-5" />
            </button>
            <div className="text-sm">
              <p className="font-medium text-light-text dark:text-dark-text">{usuario.nome}</p>
              <p className="text-light-text-muted dark:text-dark-text-muted">{usuario.papel}</p>
            </div>
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
        <main className="bg-light-bg-muted p-4 dark:bg-dark-bg md:p-6">{children}</main>
      </div>
    </div>
  );
}
