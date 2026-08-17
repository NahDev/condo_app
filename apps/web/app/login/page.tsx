"use client";

import { useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@condo/shared";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      await login(email, senha);
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Erro ao entrar. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-xl border border-light-border bg-light-card p-8 shadow-sm dark:border-dark-border dark:bg-dark-card dark:shadow-none"
      >
        <div className="space-y-4">
          <Logo className="justify-center" />
          <div>
            <h1 className="text-xl font-semibold text-light-text dark:text-dark-text">Entrar</h1>
            <p className="text-sm text-light-text-muted dark:text-dark-text-muted">
              Acesse o painel do seu condomínio.
            </p>
          </div>
        </div>

        <div className="space-y-1">
          <label
            className="text-sm font-medium text-light-text dark:text-dark-text"
            htmlFor="email"
          >
            E-mail
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-light-border bg-light-card px-3 py-2 text-sm text-light-text placeholder:text-light-text-muted/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-dark-border dark:bg-dark-bg dark:text-dark-text dark:placeholder:text-dark-text-muted/70"
          />
        </div>

        <div className="space-y-1">
          <label
            className="text-sm font-medium text-light-text dark:text-dark-text"
            htmlFor="senha"
          >
            Senha
          </label>
          <input
            id="senha"
            type="password"
            required
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="w-full rounded-md border border-light-border bg-light-card px-3 py-2 text-sm text-light-text placeholder:text-light-text-muted/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-dark-border dark:bg-dark-bg dark:text-dark-text dark:placeholder:text-dark-text-muted/70"
          />
        </div>

        {erro && <p className="text-sm text-error">{erro}</p>}

        <button
          type="submit"
          disabled={enviando}
          className="w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {enviando ? "Entrando..." : "Entrar"}
        </button>

        <p className="text-xs text-light-text-muted dark:text-dark-text-muted">
          Seed de exemplo: sindico@exemplo.com / senha123
        </p>

        <p className="text-center text-xs text-light-text-muted dark:text-dark-text-muted">
          <a href="/privacidade" className="underline hover:text-light-text dark:hover:text-dark-text">
            Política de Privacidade
          </a>
        </p>
      </form>
    </div>
  );
}
