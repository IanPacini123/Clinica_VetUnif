# 09: Atendimento pelo VETERINARIO

**What to build:** o VETERINARIO escolhe qualquer Paciente da Fila e entra na tela de Atendimento, que passa a EM_ATENDIMENTO com ele como responsável. Ele preenche peso, anamnese, diagnóstico e conduta e finaliza, ou devolve o Paciente à Fila. Se ele sair da tela, a Recepção mostra "Continuar atendimento".

**Blocked by:** 08 (Chegada e Fila)

**Status:** ready-for-agent

- [ ] Só VETERINARIO pode pegar um Paciente; ADMIN e ATENDENTE recebem 403
- [ ] Pegar Paciente muda o Status para EM_ATENDIMENTO e registra o VETERINARIO
- [ ] Se dois VETERINARIOS pegam o mesmo Paciente, o segundo recebe 409 "Paciente já está em atendimento com Dr(a). X"
- [ ] VETERINARIO com Atendimento EM_ATENDIMENTO não pode pegar outro (409 "Finalize ou devolva o atendimento atual antes de iniciar outro")
- [ ] Formulário com peso, anamnese/observações, diagnóstico e conduta; diagnóstico e conduta obrigatórios para finalizar
- [ ] A tela mostra os dados do Animal, do Tutor, a Queixa e a Prioridade
- [ ] Finalizar muda o Status para FINALIZADO; Atendimento FINALIZADO não pode mais ser editado (409)
- [ ] Devolver à Fila volta o Status para AGUARDANDO e remove o VETERINARIO
- [ ] Só o VETERINARIO responsável pode editar, finalizar ou devolver
- [ ] Recepção mostra atalho "Continuar atendimento" ao VETERINARIO com Atendimento em andamento
- [ ] Funciona na URL publicada
