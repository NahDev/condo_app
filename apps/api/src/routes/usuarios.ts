import type { FastifyInstance } from "fastify";
import { hash } from "bcryptjs";
import {
  atualizarPermissoesSchema,
  atualizarStatusUsuarioSchema,
  criarUsuarioSchema,
  PERMISSOES_PADRAO,
  RECURSOS,
  type UsuarioAdmin,
} from "@condo/shared";
import { Prisma, prisma } from "@condo/db";
import { authenticate, requirePapel } from "../auth/hooks";

function toUsuarioAdmin(usuario: {
  id: string;
  nome: string;
  email: string;
  papel: "ADMIN" | "SINDICO" | "MORADOR" | "PORTEIRO";
  ativo: boolean;
  unidadeId: string | null;
  unidade: { identificacao: string } | null;
  permissoes: { recurso: UsuarioAdmin["permissoes"][number]["recurso"]; podeVisualizar: boolean; podeGerenciar: boolean }[];
}): UsuarioAdmin {
  return {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    papel: usuario.papel,
    ativo: usuario.ativo,
    unidadeId: usuario.unidadeId,
    unidadeIdentificacao: usuario.unidade?.identificacao ?? null,
    permissoes: usuario.permissoes.map((p) => ({
      recurso: p.recurso,
      podeVisualizar: p.podeVisualizar,
      podeGerenciar: p.podeGerenciar,
    })),
  };
}

const includeRelacoes = {
  unidade: { select: { identificacao: true } },
  permissoes: true,
} as const;

export async function usuariosRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authenticate);
  app.addHook("preHandler", requirePapel("SINDICO", "ADMIN"));

  app.get("/usuarios", async (request) => {
    const usuarios = await prisma.usuario.findMany({
      where: { condominioId: request.usuario!.condominioId },
      orderBy: { nome: "asc" },
      include: includeRelacoes,
    });

    return usuarios.map(toUsuarioAdmin);
  });

  app.post("/usuarios", async (request, reply) => {
    const parsed = criarUsuarioSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ message: "Dados inválidos", issues: parsed.error.issues });
    }

    const { nome, email, senha, papel, unidadeId } = parsed.data;
    const condominioId = request.usuario!.condominioId;

    if (unidadeId) {
      const unidade = await prisma.unidade.findFirst({ where: { id: unidadeId, condominioId } });
      if (!unidade) {
        return reply.code(404).send({ message: "Unidade não encontrada" });
      }
    }

    const senhaHash = await hash(senha, 10);

    try {
      const usuario = await prisma.usuario.create({
        data: {
          nome,
          email,
          senhaHash,
          papel,
          condominioId,
          unidadeId: unidadeId ?? null,
          permissoes:
            papel === "MORADOR" || papel === "PORTEIRO"
              ? {
                  create: RECURSOS.map((recurso) => ({
                    recurso,
                    podeVisualizar: PERMISSOES_PADRAO[papel][recurso].podeVisualizar,
                    podeGerenciar: PERMISSOES_PADRAO[papel][recurso].podeGerenciar,
                  })),
                }
              : undefined,
        },
        include: includeRelacoes,
      });

      return reply.code(201).send(toUsuarioAdmin(usuario));
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        return reply.code(409).send({ message: "Já existe um usuário com este e-mail" });
      }
      throw err;
    }
  });

  app.patch("/usuarios/:id/status", async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = atualizarStatusUsuarioSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ message: "Dados inválidos", issues: parsed.error.issues });
    }

    if (id === request.usuario!.sub) {
      return reply.code(400).send({ message: "Você não pode desativar seu próprio usuário" });
    }

    const usuario = await prisma.usuario.findFirst({
      where: { id, condominioId: request.usuario!.condominioId },
    });
    if (!usuario) {
      return reply.code(404).send({ message: "Usuário não encontrado" });
    }

    const atualizado = await prisma.usuario.update({
      where: { id },
      data: { ativo: parsed.data.ativo },
      include: includeRelacoes,
    });

    return toUsuarioAdmin(atualizado);
  });

  app.put("/usuarios/:id/permissoes", async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = atualizarPermissoesSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ message: "Dados inválidos", issues: parsed.error.issues });
    }

    const usuario = await prisma.usuario.findFirst({
      where: { id, condominioId: request.usuario!.condominioId },
    });
    if (!usuario) {
      return reply.code(404).send({ message: "Usuário não encontrado" });
    }
    if (usuario.papel === "SINDICO" || usuario.papel === "ADMIN") {
      return reply
        .code(400)
        .send({ message: "Síndicos e administradores já têm acesso total" });
    }

    await prisma.$transaction(
      parsed.data.permissoes.map((p) =>
        prisma.usuarioPermissao.upsert({
          where: { usuarioId_recurso: { usuarioId: id, recurso: p.recurso } },
          update: { podeVisualizar: p.podeVisualizar, podeGerenciar: p.podeGerenciar },
          create: {
            usuarioId: id,
            recurso: p.recurso,
            podeVisualizar: p.podeVisualizar,
            podeGerenciar: p.podeGerenciar,
          },
        }),
      ),
    );

    const atualizado = await prisma.usuario.findUniqueOrThrow({
      where: { id },
      include: includeRelacoes,
    });

    return toUsuarioAdmin(atualizado);
  });
}
