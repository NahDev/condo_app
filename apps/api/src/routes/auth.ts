import type { FastifyInstance } from "fastify";
import { compare } from "bcryptjs";
import { loginSchema, type AuthResponse, type UsuarioPublico } from "@condo/shared";
import { prisma } from "@condo/db";
import { signAccessToken } from "../auth/jwt";
import { criarRefreshToken, revogarRefreshToken, rotacionarRefreshToken } from "../auth/refresh-tokens";

function toUsuarioPublico(usuario: {
  id: string;
  nome: string;
  email: string;
  papel: UsuarioPublico["papel"];
  condominioId: string;
  unidadeId: string | null;
  permissoes: { recurso: UsuarioPublico["permissoes"][number]["recurso"]; podeVisualizar: boolean; podeGerenciar: boolean }[];
}): UsuarioPublico {
  return {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    papel: usuario.papel,
    condominioId: usuario.condominioId,
    unidadeId: usuario.unidadeId,
    permissoes: usuario.permissoes.map((p) => ({
      recurso: p.recurso,
      podeVisualizar: p.podeVisualizar,
      podeGerenciar: p.podeGerenciar,
    })),
  };
}

export async function authRoutes(app: FastifyInstance) {
  app.post(
    "/auth/login",
    {
      config: {
        rateLimit: {
          max: 5,
          timeWindow: "15 minutes",
        },
      },
    },
    async (request, reply) => {
      const parsed = loginSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ message: "Dados inválidos", issues: parsed.error.issues });
      }

      const { email, senha } = parsed.data;
      const usuario = await prisma.usuario.findUnique({
        where: { email },
        include: { permissoes: true },
      });

      if (!usuario || !(await compare(senha, usuario.senhaHash))) {
        return reply.code(401).send({ message: "E-mail ou senha inválidos" });
      }

      if (!usuario.ativo) {
        return reply.code(403).send({ message: "Usuário desativado. Fale com o síndico." });
      }

      const payload = {
        sub: usuario.id,
        condominioId: usuario.condominioId,
        papel: usuario.papel,
        unidadeId: usuario.unidadeId,
      };
      const response: AuthResponse = {
        accessToken: signAccessToken(payload),
        refreshToken: await criarRefreshToken(payload),
        usuario: toUsuarioPublico(usuario),
      };

      return response;
    },
  );

  app.post("/auth/refresh", async (request, reply) => {
    const body = request.body as { refreshToken?: string } | undefined;
    if (!body?.refreshToken) {
      return reply.code(400).send({ message: "refreshToken é obrigatório" });
    }

    const resultado = await rotacionarRefreshToken(body.refreshToken);
    if (!resultado) {
      return reply.code(401).send({ message: "Sessão expirada. Faça login novamente." });
    }

    return {
      accessToken: signAccessToken(resultado.usuario),
      refreshToken: resultado.refreshToken,
    };
  });

  app.post("/auth/logout", async (request, reply) => {
    const body = request.body as { refreshToken?: string } | undefined;
    if (body?.refreshToken) {
      await revogarRefreshToken(body.refreshToken);
    }
    return reply.code(204).send();
  });
}
