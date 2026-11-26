-- CreateEnum
CREATE TYPE "perfil" AS ENUM ('ADMIN', 'ATENDENTE', 'VETERINARIO');

-- CreateTable
CREATE TABLE "usuario" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "nome_usuario" TEXT NOT NULL,
    "senha_hash" TEXT NOT NULL,
    "perfil" "perfil" NOT NULL,
    "crmv" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuario_nome_usuario_key" ON "usuario"("nome_usuario");
