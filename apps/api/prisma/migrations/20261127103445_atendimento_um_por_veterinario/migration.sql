-- CreateIndex
CREATE UNIQUE INDEX "atendimento_veterinario_id_key" ON "atendimento"("veterinario_id") WHERE (status = 'EM_ATENDIMENTO'::status_atendimento);

