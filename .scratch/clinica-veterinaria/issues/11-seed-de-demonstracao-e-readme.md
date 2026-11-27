# 11: Seed de demonstração e README

**What to build:** o professor abre o link publicado, lê o README e consegue entrar com um Usuário de cada Perfil e encontrar dados de exemplo: Tutores, Animais, uma Fila com Pacientes e Animais com Histórico.

**Blocked by:** 07 (Gestão de Usuários), 10 (Histórico do Animal)

**Status:** done

- [x] Seed de demonstração cria os Usuários `admin`, `atendente` e `veterinario`
- [x] Seed cria Tutores, Animais, Atendimentos FINALIZADOS e CANCELADOS, e alguns AGUARDANDO (pelo menos um com Prioridade)
- [x] Seed é executado uma vez no banco de produção e pode ser repetido sem duplicar dados
- [x] README com: descrição do projeto, link da aplicação, credenciais de demonstração, stack, como rodar localmente com `docker compose`, aviso sobre a primeira visita lenta (hibernação do Render) e links para CONTEXT.md, especificação e ADRs
- [x] README explica que "excluir" é Inativação (ADR 0001)
