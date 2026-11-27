-- CreateEnum
CREATE TYPE "status_atendimento" AS ENUM ('AGUARDANDO', 'EM_ATENDIMENTO', 'FINALIZADO', 'CANCELADO');

-- CreateTable
CREATE TABLE "atendimento" (
    "id" SERIAL NOT NULL,
    "animal_id" INTEGER NOT NULL,
    "veterinario_id" INTEGER,
    "status" "status_atendimento" NOT NULL DEFAULT 'AGUARDANDO',
    "prioridade" BOOLEAN NOT NULL DEFAULT false,
    "queixa" TEXT,
    "data_chegada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_inicio" TIMESTAMP(3),
    "data_fim" TIMESTAMP(3),
    "peso" DECIMAL(5,2),
    "anamnese" TEXT,
    "diagnostico" TEXT,
    "conduta" TEXT,

    CONSTRAINT "atendimento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "atendimento_animal_id_idx" ON "atendimento"("animal_id");

-- CreateIndex
CREATE UNIQUE INDEX "atendimento_animal_id_key" ON "atendimento"("animal_id") WHERE (status IN ('AGUARDANDO', 'EM_ATENDIMENTO'));

-- AddForeignKey
ALTER TABLE "atendimento" ADD CONSTRAINT "atendimento_animal_id_fkey" FOREIGN KEY ("animal_id") REFERENCES "animal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atendimento" ADD CONSTRAINT "atendimento_veterinario_id_fkey" FOREIGN KEY ("veterinario_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
