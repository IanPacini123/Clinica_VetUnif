# 09: Atendimento pelo VETERINARIO

**What to build:** o VETERINARIO escolhe qualquer Paciente da Fila e entra na tela de Atendimento, que passa a EM_ATENDIMENTO com ele como responsável. Ele preenche peso, anamnese, diagnóstico e conduta e finaliza, ou devolve o Paciente à Fila. Se ele sair da tela, a Recepção mostra "Continuar atendimento".

**Blocked by:** 08 (Chegada e Fila)

**Status:** done

- [x] Só VETERINARIO pode pegar um Paciente; ADMIN e ATENDENTE recebem 403
- [x] Pegar Paciente muda o Status para EM_ATENDIMENTO e registra o VETERINARIO
- [x] Se dois VETERINARIOS pegam o mesmo Paciente, o segundo recebe 409 "Paciente já está em atendimento com Dr(a). X"
- [x] VETERINARIO com Atendimento EM_ATENDIMENTO não pode pegar outro (409 "Finalize ou devolva o atendimento atual antes de iniciar outro")
- [x] Formulário com peso, anamnese/observações, diagnóstico e conduta; diagnóstico e conduta obrigatórios para finalizar
- [x] A tela mostra os dados do Animal, do Tutor, a Queixa e a Prioridade
- [x] Finalizar muda o Status para FINALIZADO; Atendimento FINALIZADO não pode mais ser editado (409)
- [x] Devolver à Fila volta o Status para AGUARDANDO e remove o VETERINARIO
- [x] Só o VETERINARIO responsável pode editar, finalizar ou devolver
- [x] Recepção mostra atalho "Continuar atendimento" ao VETERINARIO com Atendimento em andamento
- [x] Funciona na URL publicada
