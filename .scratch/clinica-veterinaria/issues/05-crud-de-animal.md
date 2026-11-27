# 05: CRUD de Animal

**What to build:** a ATENDENTE (e o ADMIN) lista, busca, cadastra, vê os detalhes, edita e inativa Animais. O cadastro de Animal tem uma seção para buscar um Tutor existente ou cadastrar um novo ali mesmo. Os detalhes do Tutor passam a listar seus Animais, com botão "Adicionar animal". O VETERINARIO vê e edita, mas não cria nem inativa. Completa o CRUD avaliado pelo enunciado.

**Blocked by:** 04 (CRUD de Tutor)

**Status:** done

- [x] Entidade Animal no banco com nome, espécie, raça opcional, sexo, data de nascimento opcional, Tutor (obrigatório) e indicador de ativo
- [x] Schemas Zod do Animal no pacote shared, usados pelo formulário e pela rota
- [x] Espécie restrita a Cachorro, Gato, Ave, Roedor ou Outro; sexo Macho ou Fêmea; data de nascimento não pode ser futura
- [x] O Tutor do Animal precisa existir e estar ativo
- [x] Seção de busca ou cadastro de Tutor dentro do cadastro de Animal
- [x] Edição permite trocar o Tutor do Animal
- [x] Listagem mostra só ativos, com busca por nome do Animal ou do Tutor e paginação de 20 por página
- [x] Detalhes do Tutor listam seus Animais ativos; "Adicionar animal" abre o cadastro com o Tutor preenchido
- [x] Inativar Animal pede confirmação e o remove das listagens
- [x] Inativar um Tutor com Animais ativos devolve 409 com a mensagem "inative os animais primeiro"
- [x] VETERINARIO não vê os botões de criar e inativar, e a API devolve 403 se ele tentar
- [x] Layout funciona no celular
- [x] Funciona na URL publicada
