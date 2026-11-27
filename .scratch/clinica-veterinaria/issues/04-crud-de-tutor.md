# 04: CRUD de Tutor

**What to build:** a ATENDENTE (e o ADMIN) lista, busca, cadastra, vê os detalhes, edita e inativa Tutores. O VETERINARIO vê e edita, mas não cria nem inativa. Os formulários validam os campos com as mesmas regras da API e mostram o erro em cada campo. É metade do CRUD avaliado pelo enunciado.

**Blocked by:** 03 (Login e sessão)

**Status:** done

- [x] Entidade Tutor no banco com nome, CPF único, telefone, e-mail opcional e indicador de ativo
- [x] Schemas Zod do Tutor no pacote shared, usados pelo formulário e pela rota
- [x] Nome obrigatório com pelo menos 3 caracteres; CPF obrigatório com dígitos verificadores válidos; telefone obrigatório; e-mail com formato válido quando informado
- [x] CPF repetido devolve 409 com mensagem clara
- [x] Listagem mostra só ativos, com busca por nome ou CPF e paginação de 20 por página
- [x] Telas de cadastro, edição e detalhes do Tutor
- [x] Inativar pede confirmação e remove o Tutor das listagens (exclusão lógica, ADR 0001)
- [x] VETERINARIO não vê os botões de criar e inativar, e a API devolve 403 se ele tentar
- [x] Layout funciona no celular
- [x] Funciona na URL publicada
