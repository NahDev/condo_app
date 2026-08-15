import type { FastifyReply, FastifyRequest } from "fastify";
import type { Papel, Recurso } from "@condo/shared";
import { prisma } from "@condo/db";
import { verifyAccessToken } from "./jwt";

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  const header = request.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : undefined;

  if (!token) {
    return reply.code(401).send({ message: "Token de acesso ausente" });
  }

  try {
    request.usuario = verifyAccessToken(token);
  } catch {
    return reply.code(401).send({ message: "Token de acesso inválido ou expirado" });
  }
}

export function requirePapel(...papeisPermitidos: Papel[]) {
  return async function (request: FastifyRequest, reply: FastifyReply) {
    if (!request.usuario || !papeisPermitidos.includes(request.usuario.papel)) {
      return reply.code(403).send({ message: "Permissão insuficiente" });
    }
  };
}

/**
 * SINDICO e ADMIN têm acesso total. Para os demais papéis, a permissão é
 * consultada na tabela UsuarioPermissao (configurável por síndico/admin).
 */
export function requirePermissao(recurso: Recurso, opcoes: { gerenciar?: boolean } = {}) {
  return async function (request: FastifyRequest, reply: FastifyReply) {
    const usuario = request.usuario;
    if (!usuario) {
      return reply.code(401).send({ message: "Token de acesso ausente" });
    }

    if (usuario.papel === "SINDICO" || usuario.papel === "ADMIN") {
      return;
    }

    const permissao = await prisma.usuarioPermissao.findUnique({
      where: { usuarioId_recurso: { usuarioId: usuario.sub, recurso } },
    });

    if (!permissao || !permissao.podeVisualizar) {
      return reply.code(403).send({ message: "Você não tem acesso a este recurso" });
    }

    if (opcoes.gerenciar && !permissao.podeGerenciar) {
      return reply.code(403).send({ message: "Você não tem permissão para gerenciar este recurso" });
    }
  };
}
