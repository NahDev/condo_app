-- CreateEnum
CREATE TYPE "Recurso" AS ENUM ('AVISOS', 'UNIDADES', 'AREAS_COMUNS', 'RESERVAS', 'OCORRENCIAS', 'VISITANTES', 'ENCOMENDAS');

-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "ativo" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "usuario_permissoes" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "recurso" "Recurso" NOT NULL,
    "podeVisualizar" BOOLEAN NOT NULL DEFAULT true,
    "podeGerenciar" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "usuario_permissoes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuario_permissoes_usuarioId_recurso_key" ON "usuario_permissoes"("usuarioId", "recurso");

-- AddForeignKey
ALTER TABLE "usuario_permissoes" ADD CONSTRAINT "usuario_permissoes_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
