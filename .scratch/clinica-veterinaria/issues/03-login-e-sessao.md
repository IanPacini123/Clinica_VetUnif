# 03: Login e sessão

**What to build:** o ADMIN criado por seed entra no sistema com nome de usuário e senha e cai na Recepção (ainda vazia). Todas as telas e rotas da API, exceto login e saúde, exigem sessão. O layout tem menu lateral (hambúrguer no celular) com itens conforme o Perfil, e o topo mostra nome, Perfil e botão de sair.

**Blocked by:** 02 (Esqueleto publicado)

**Status:** done

- [x] Entidade Usuário no banco com nome, nome de usuário, senha em hash, Perfil, CRMV opcional e indicador de ativo
- [x] Seed cria o ADMIN inicial
- [x] Login com nome de usuário e senha devolve JWT com validade de 8h; credenciais inválidas mostram mensagem clara
- [x] Usuário inativo não consegue logar
- [x] Rotas da API protegidas devolvem 401 sem token válido; o front redireciona para o login ao receber 401
- [x] Mecanismo reutilizável na API para restringir rotas por Perfil (devolve 403)
- [x] Guardas de rota no Vue impedem acesso a telas sem sessão
- [x] Recepção é a tela inicial após o login
- [x] Menu lateral no desktop e hambúrguer no celular; botão de sair encerra a sessão
- [x] Funciona na URL publicada
