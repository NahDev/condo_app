"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Logo } from "@/components/Logo";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { usuario, carregando, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!carregando && !usuario) {
      router.push("/login");
    }
  }, [carregando, usuario, router]);

  if (carregando || !usuario) {
    return <div className="p-8 text-sm text-slate-500">Carregando...</div>;
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 shrink-0 border-r border-slate-200 bg-white p-4">
        <Logo className="mb-6" />
        <nav className="space-y-1 text-sm">
          <a
            href="/dashboard/avisos"
            className="block rounded-md px-3 py-2 hover:bg-slate-100"
          >
            Avisos
          </a>
          <a
            href="/dashboard/unidades"
            className="block rounded-md px-3 py-2 hover:bg-slate-100"
          >
            Unidades
          </a>
          <a
            href="/dashboard/areas"
            className="block rounded-md px-3 py-2 hover:bg-slate-100"
          >
            Áreas comuns
          </a>
          <a
            href="/dashboard/reservas"
            className="block rounded-md px-3 py-2 hover:bg-slate-100"
          >
            Reservas
          </a>
          <a
            href="/dashboard/ocorrencias"
            className="block rounded-md px-3 py-2 hover:bg-slate-100"
          >
            Ocorrências
          </a>
          <a
            href="/dashboard/visitantes"
            className="block rounded-md px-3 py-2 hover:bg-slate-100"
          >
            Visitantes
          </a>
          <a
            href="/dashboard/encomendas"
            className="block rounded-md px-3 py-2 hover:bg-slate-100"
          >
            Encomendas
          </a>
          {(usuario.papel === "SINDICO" || usuario.papel === "ADMIN") && (
            <a
              href="/dashboard/usuarios"
              className="block rounded-md px-3 py-2 hover:bg-slate-100"
            >
              Usuários
            </a>
          )}
        </nav>
      </aside>
      <div className="flex-1">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
          <div className="text-sm">
            <p className="font-medium">{usuario.nome}</p>
            <p className="text-slate-500">{usuario.papel}</p>
          </div>
          <button onClick={logout} className="text-sm text-slate-500 hover:text-slate-900">
            Sair
          </button>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
