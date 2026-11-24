# 03: Login e sessão

**What to build:** o ADMIN criado por seed entra no sistema com nome de usuário e senha e cai na Recepção (ainda vazia). Todas as telas e rotas da API, exceto login e saúde, exigem sessão. O layout tem menu lateral (hambúrguer no celular) com itens conforme o Perfil, e o topo mostra nome, Perfil e botão de sair.

**Blocked by:** 02 (Esqueleto publicado)

**Status:** ready-for-agent

- [ ] Entidade Usuário no banco com nome, nome de usuário, senha em hash, Perfil, CRMV opcional e indicador de ativo
- [ ] Seed cria o ADMIN inicial
- [ ] Login com nome de usuário e senha devolve JWT com validade de 8h; credenciais inválidas mostram mensagem clara
- [ ] Usuário inativo não consegue logar
- [ ] Rotas da API protegidas devolvem 401 sem token válido; o front redireciona para o login ao receber 401
- [ ] Mecanismo reutilizável na API para restringir rotas por Perfil (devolve 403)
- [ ] Guardas de rota no Vue impedem acesso a telas sem sessão
- [ ] Recepção é a tela inicial após o login
- [ ] Menu lateral no desktop e hambúrguer no celular; botão de sair encerra a sessão
- [ ] Funciona na URL publicada
