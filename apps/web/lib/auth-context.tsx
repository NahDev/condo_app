"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { UsuarioPublico } from "@condo/shared";
import { api, clearTokens, getAccessToken, getRefreshToken, setTokens } from "./api";

interface AuthContextValue {
  usuario: UsuarioPublico | null;
  carregando: boolean;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const USUARIO_KEY = "condo_usuario";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioPublico | null>(null);
  const [carregando, setCarregando] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = getAccessToken();
    const stored = localStorage.getItem(USUARIO_KEY);
    if (token && stored) {
      setUsuario(JSON.parse(stored));
    }
    setCarregando(false);
  }, []);

  async function login(email: string, senha: string) {
    const res = await api.login(email, senha);
    setTokens(res.accessToken, res.refreshToken);
    localStorage.setItem(USUARIO_KEY, JSON.stringify(res.usuario));
    setUsuario(res.usuario);
    router.push("/dashboard");
  }

  function logout() {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      api.logout(refreshToken).catch(() => {});
    }
    clearTokens();
    localStorage.removeItem(USUARIO_KEY);
    setUsuario(null);
    router.push("/login");
  }

  return (
    <AuthContext.Provider value={{ usuario, carregando, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
