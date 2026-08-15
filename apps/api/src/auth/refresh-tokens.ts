import { createHash } from "node:crypto";
import { prisma } from "@condo/db";
import { signRefreshToken, verifyRefreshToken, type TokenPayload } from "./jwt";

const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function criarRefreshToken(payload: TokenPayload): Promise<string> {
  const token = signRefreshToken(payload);

  await prisma.refreshToken.create({
    data: {
      usuarioId: payload.sub,
      tokenHash: hashToken(token),
      expiraEm: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    },
  });

  return token;
}

/**
 * Valida um refresh token contra o banco (não revogado, não expirado, usuário ativo)
 * e roda rotação: revoga o token usado e emite um novo.
 * Retorna null se o token for inválido por qualquer motivo.
 */
export async function rotacionarRefreshToken(token: string): Promise<{
  usuario: TokenPayload;
  refreshToken: string;
} | null> {
  let payload: TokenPayload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    return null;
  }

  const tokenHash = hashToken(token);
  const registro = await prisma.refreshToken.findUnique({ where: { tokenHash } });

  if (!registro || registro.revogadoEm || registro.expiraEm < new Date()) {
    return null;
  }

  const usuario = await prisma.usuario.findUnique({ where: { id: payload.sub } });
  if (!usuario || !usuario.ativo) {
    return null;
  }

  await prisma.refreshToken.update({
    where: { id: registro.id },
    data: { revogadoEm: new Date() },
  });

  const novoPayload: TokenPayload = {
    sub: usuario.id,
    condominioId: usuario.condominioId,
    papel: usuario.papel,
    unidadeId: usuario.unidadeId,
  };
  const refreshToken = await criarRefreshToken(novoPayload);

  return { usuario: novoPayload, refreshToken };
}

/** Revoga um refresh token (usado no logout). Idempotente — não erra se já não existir. */
export async function revogarRefreshToken(token: string): Promise<void> {
  const tokenHash = hashToken(token);
  await prisma.refreshToken.updateMany({
    where: { tokenHash, revogadoEm: null },
    data: { revogadoEm: new Date() },
  });
}
