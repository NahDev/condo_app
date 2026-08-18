"use client";

import { useEffect } from "react";
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

function NavLink({ href, label, pathname }: { href: string; label: string; pathname: string }) {
  const ativo = pathname === href;
  return (
    <Link href={href} className={`${linkBase} ${ativo ? linkAtivo : linkInativo}`}>
      {label}
    </Link>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { usuario, carregando, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

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
        <Link href="/dashboard" className="mb-6 block">
          <Logo />
        </Link>
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
