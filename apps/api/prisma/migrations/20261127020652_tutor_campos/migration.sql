/*
  Warnings:

  - A unique constraint covering the columns `[cpf]` on the table `tutor` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `cpf` to the `tutor` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nome` to the `tutor` table without a default value. This is not possible if the table is not empty.
  - Added the required column `telefone` to the `tutor` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "tutor" ADD COLUMN     "ativo" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "cpf" CHAR(11) NOT NULL,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "nome" TEXT NOT NULL,
ADD COLUMN     "telefone" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "tutor_cpf_key" ON "tutor"("cpf");
