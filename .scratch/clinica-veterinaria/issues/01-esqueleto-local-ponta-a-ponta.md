# 01: Esqueleto local ponta a ponta

**What to build:** com um único comando do `docker compose`, sobem web, api e Postgres em rede. A página inicial do Vue chama uma rota de saúde da API, que consulta o banco e responde; a página mostra "API ok / banco ok" ou uma mensagem de erro clara se algo estiver fora. É o tracer bullet que atravessa todas as camadas: Vue → pacote compartilhado → Fastify → Prisma → Postgres.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Monorepo com npm workspaces: web (Vue 3 + Vite + Tailwind), api (Fastify + Prisma) e shared, tudo em TypeScript
- [ ] O pacote shared exporta um schema Zod usado pela api para a resposta da rota de saúde e pelo web para tipar o consumo
- [ ] A rota de saúde executa uma consulta real no Postgres via Prisma
- [ ] Erros da API seguem o formato padrão `{ mensagem, campos? }` (handler global no Fastify)
- [ ] `docker compose up` sobe os três serviços; o web consegue falar com a api pela rede do compose
- [ ] Prisma com primeira migration aplicada no Postgres local
- [ ] Com a api derrubada, a página mostra mensagem de erro amigável em vez de quebrar
