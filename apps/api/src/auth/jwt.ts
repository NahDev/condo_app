import { randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import { env } from "../env";
import type { Papel } from "@condo/shared";

export interface TokenPayload {
  sub: string;
  condominioId: string;
  papel: Papel;
  unidadeId: string | null;
}

export function signAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: "15m" });
}

export function signRefreshToken(payload: TokenPayload): string {
  // jti garante que o token seja único mesmo se assinado no mesmo segundo com o mesmo payload
  // (o hash do token é usado como chave única na tabela de refresh tokens).
  return jwt.sign({ ...payload, jti: randomUUID() }, env.JWT_REFRESH_SECRET, { expiresIn: "7d" });
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
}
