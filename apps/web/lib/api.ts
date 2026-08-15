"use client";

import { createApiClient } from "@condo/shared";

const TOKEN_KEY = "condo_access_token";
const REFRESH_KEY = "condo_refresh_token";
const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_KEY);
}

export function setTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_KEY, refreshToken);
}

export function clearTokens() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

let refreshEmAndamento: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  if (!refreshEmAndamento) {
    refreshEmAndamento = fetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    })
      .then(async (res) => {
        if (!res.ok) return null;
        const data = (await res.json()) as { accessToken: string; refreshToken: string };
        setTokens(data.accessToken, data.refreshToken);
        return data.accessToken;
      })
      .catch(() => null)
      .finally(() => {
        refreshEmAndamento = null;
      });
  }

  return refreshEmAndamento;
}

export const api = createApiClient({
  baseUrl: BASE_URL,
  getAccessToken,
  refreshAccessToken,
  onUnauthorized: () => {
    clearTokens();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  },
});
