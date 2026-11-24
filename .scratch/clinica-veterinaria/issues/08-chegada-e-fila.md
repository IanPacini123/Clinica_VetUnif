# 08: Chegada e Fila

**What to build:** na Recepção, a ATENDENTE busca um Animal e registra sua Chegada, opcionalmente marcando Prioridade e Queixa. Isso cria um Atendimento AGUARDANDO, que aparece na Fila. Se o Animal não existe, ela vai ao cadastro de Animal e volta para a Chegada com ele já selecionado. Todos os Perfis veem a Fila.

**Blocked by:** 05 (CRUD de Animal)

**Status:** ready-for-agent

- [ ] Entidade Atendimento no banco com Animal, VETERINARIO (opcional até ser pego), Status, Prioridade, Queixa, datas e os campos clínicos (peso, anamnese, diagnóstico, conduta) ainda vazios
- [ ] Status possíveis: AGUARDANDO, EM_ATENDIMENTO, FINALIZADO, CANCELADO
- [ ] Registrar Chegada cria Atendimento AGUARDANDO; só ATENDENTE e ADMIN podem
- [ ] Queixa opcional, obrigatória quando Prioridade está marcada
- [ ] Animal com Atendimento em aberto (AGUARDANDO ou EM_ATENDIMENTO) não pode receber nova Chegada (409)
- [ ] Fluxo de Animal novo: cadastro de Animal e retorno à Chegada com o Animal selecionado
- [ ] Fila mostra Atendimentos AGUARDANDO e EM_ATENDIMENTO; prioritários no topo com cor diferente, depois por ordem de Chegada; entre prioritários, por Chegada
- [ ] Cards EM_ATENDIMENTO mostram o nome do VETERINARIO
- [ ] Fila atualiza sozinha a cada ~10s e tem botão de atualizar
- [ ] Prioridade e Queixa editáveis enquanto AGUARDANDO
- [ ] Cancelar Atendimento AGUARDANDO (ATENDENTE e ADMIN), com confirmação
- [ ] Inativar Animal com Atendimento em aberto devolve 409 com mensagem clara
- [ ] Layout da Fila funciona no celular
- [ ] Funciona na URL publicada
