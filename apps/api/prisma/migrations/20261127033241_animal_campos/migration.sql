/*
  Warnings:

  - Added the required column `especie` to the `animal` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nome` to the `animal` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sexo` to the `animal` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tutor_id` to the `animal` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "especie" AS ENUM ('CACHORRO', 'GATO', 'AVE', 'ROEDOR', 'OUTRO');

-- CreateEnum
CREATE TYPE "sexo" AS ENUM ('MACHO', 'FEMEA');

-- AlterTable
ALTER TABLE "animal" ADD COLUMN     "ativo" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "data_nascimento" DATE,
ADD COLUMN     "especie" "especie" NOT NULL,
ADD COLUMN     "nome" TEXT NOT NULL,
ADD COLUMN     "raca" TEXT,
ADD COLUMN     "sexo" "sexo" NOT NULL,
ADD COLUMN     "tutor_id" INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX "animal_tutor_id_idx" ON "animal"("tutor_id");

-- AddForeignKey
ALTER TABLE "animal" ADD CONSTRAINT "animal_tutor_id_fkey" FOREIGN KEY ("tutor_id") REFERENCES "tutor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
