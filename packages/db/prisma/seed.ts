import { PrismaClient, Papel, Recurso } from "@prisma/client";
import { hash } from "bcryptjs";
import { PERMISSOES_PADRAO, RECURSOS } from "@condo/shared";

const prisma = new PrismaClient();

async function seedPermissoes(usuarioId: string, papel: "MORADOR" | "PORTEIRO") {
  for (const recurso of RECURSOS) {
    const preset = PERMISSOES_PADRAO[papel][recurso];
    await prisma.usuarioPermissao.upsert({
      where: { usuarioId_recurso: { usuarioId, recurso: recurso as Recurso } },
      update: {},
      create: {
        usuarioId,
        recurso: recurso as Recurso,
        podeVisualizar: preset.podeVisualizar,
        podeGerenciar: preset.podeGerenciar,
      },
    });
  }
}

async function main() {
  const condominio = await prisma.condominio.upsert({
    where: { cnpj: "00.000.000/0001-00" },
    update: {},
    create: {
      nome: "Residencial Exemplo",
      cnpj: "00.000.000/0001-00",
      endereco: "Rua Exemplo, 123",
    },
  });

  const unidadeA = await prisma.unidade.upsert({
    where: { condominioId_identificacao: { condominioId: condominio.id, identificacao: "Bloco A - Apto 101" } },
    update: {},
    create: { identificacao: "Bloco A - Apto 101", condominioId: condominio.id },
  });
  const unidadeB = await prisma.unidade.upsert({
    where: { condominioId_identificacao: { condominioId: condominio.id, identificacao: "Bloco A - Apto 102" } },
    update: {},
    create: { identificacao: "Bloco A - Apto 102", condominioId: condominio.id },
  });

  const senhaHash = await hash("senha123", 10);

  await prisma.usuario.upsert({
    where: { email: "sindico@exemplo.com" },
    update: {},
    create: {
      nome: "Síndico Exemplo",
      email: "sindico@exemplo.com",
      senhaHash,
      papel: Papel.SINDICO,
      condominioId: condominio.id,
    },
  });

  const morador = await prisma.usuario.upsert({
    where: { email: "morador@exemplo.com" },
    update: {},
    create: {
      nome: "Morador Exemplo",
      email: "morador@exemplo.com",
      senhaHash,
      papel: Papel.MORADOR,
      condominioId: condominio.id,
      unidadeId: unidadeA.id,
    },
  });
  await seedPermissoes(morador.id, "MORADOR");

  const porteiro = await prisma.usuario.upsert({
    where: { email: "porteiro@exemplo.com" },
    update: {},
    create: {
      nome: "Porteiro Exemplo",
      email: "porteiro@exemplo.com",
      senhaHash,
      papel: Papel.PORTEIRO,
      condominioId: condominio.id,
    },
  });
  await seedPermissoes(porteiro.id, "PORTEIRO");

  console.log("Seed concluído:", { condominio: condominio.nome, unidades: [unidadeA.identificacao, unidadeB.identificacao] });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
