# 04: CRUD de Tutor

**What to build:** a ATENDENTE (e o ADMIN) lista, busca, cadastra, vê os detalhes, edita e inativa Tutores. O VETERINARIO vê e edita, mas não cria nem inativa. Os formulários validam os campos com as mesmas regras da API e mostram o erro em cada campo. É metade do CRUD avaliado pelo enunciado.

**Blocked by:** 03 (Login e sessão)

**Status:** ready-for-agent

- [ ] Entidade Tutor no banco com nome, CPF único, telefone, e-mail opcional e indicador de ativo
- [ ] Schemas Zod do Tutor no pacote shared, usados pelo formulário e pela rota
- [ ] Nome obrigatório com pelo menos 3 caracteres; CPF obrigatório com dígitos verificadores válidos; telefone obrigatório; e-mail com formato válido quando informado
- [ ] CPF repetido devolve 409 com mensagem clara
- [ ] Listagem mostra só ativos, com busca por nome ou CPF e paginação de 20 por página
- [ ] Telas de cadastro, edição e detalhes do Tutor
- [ ] Inativar pede confirmação e remove o Tutor das listagens (exclusão lógica, ADR 0001)
- [ ] VETERINARIO não vê os botões de criar e inativar, e a API devolve 403 se ele tentar
- [ ] Layout funciona no celular
- [ ] Funciona na URL publicada
