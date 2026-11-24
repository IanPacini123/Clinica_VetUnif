# 05: CRUD de Animal

**What to build:** a ATENDENTE (e o ADMIN) lista, busca, cadastra, vê os detalhes, edita e inativa Animais. O cadastro de Animal tem uma seção para buscar um Tutor existente ou cadastrar um novo ali mesmo. Os detalhes do Tutor passam a listar seus Animais, com botão "Adicionar animal". O VETERINARIO vê e edita, mas não cria nem inativa. Completa o CRUD avaliado pelo enunciado.

**Blocked by:** 04 (CRUD de Tutor)

**Status:** ready-for-agent

- [ ] Entidade Animal no banco com nome, espécie, raça opcional, sexo, data de nascimento opcional, Tutor (obrigatório) e indicador de ativo
- [ ] Schemas Zod do Animal no pacote shared, usados pelo formulário e pela rota
- [ ] Espécie restrita a Cachorro, Gato, Ave, Roedor ou Outro; sexo Macho ou Fêmea; data de nascimento não pode ser futura
- [ ] O Tutor do Animal precisa existir e estar ativo
- [ ] Seção de busca ou cadastro de Tutor dentro do cadastro de Animal
- [ ] Edição permite trocar o Tutor do Animal
- [ ] Listagem mostra só ativos, com busca por nome do Animal ou do Tutor e paginação de 20 por página
- [ ] Detalhes do Tutor listam seus Animais ativos; "Adicionar animal" abre o cadastro com o Tutor preenchido
- [ ] Inativar Animal pede confirmação e o remove das listagens
- [ ] Inativar um Tutor com Animais ativos devolve 409 com a mensagem "inative os animais primeiro"
- [ ] VETERINARIO não vê os botões de criar e inativar, e a API devolve 403 se ele tentar
- [ ] Layout funciona no celular
- [ ] Funciona na URL publicada
