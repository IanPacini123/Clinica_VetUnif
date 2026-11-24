# 07: Gestão de Usuários

**What to build:** o ADMIN acessa "Usuários" no menu, lista, cadastra, edita, inativa e reativa Usuários, e pode definir uma nova senha para qualquer um. Os outros Perfis não veem o item de menu e a API os bloqueia.

**Blocked by:** 03 (Login e sessão)

**Status:** ready-for-agent

- [ ] Schemas Zod do Usuário no pacote shared, usados pelo formulário e pela rota
- [ ] Nome de usuário obrigatório, único, com 3 a 30 caracteres, só letras minúsculas, números e ponto
- [ ] Nome de usuário não pode ser alterado depois de criado
- [ ] Senha com pelo menos 8 caracteres, guardada em hash
- [ ] CRMV obrigatório quando o Perfil é VETERINARIO
- [ ] ADMIN pode editar nome, Perfil e CRMV e definir nova senha
- [ ] ADMIN não pode inativar a si mesmo (409 com mensagem clara)
- [ ] Inativar e reativar Usuário; o inativo não consegue logar
- [ ] Item "Usuários" no menu só para o ADMIN; a API devolve 403 para os outros Perfis
- [ ] Funciona na URL publicada
