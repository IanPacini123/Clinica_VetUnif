# 01: Esqueleto local ponta a ponta

**What to build:** com um único comando do `docker compose`, sobem web, api e Postgres em rede. A página inicial do Vue chama uma rota de saúde da API, que consulta o banco e responde; a página mostra "API ok / banco ok" ou uma mensagem de erro clara se algo estiver fora. É o tracer bullet que atravessa todas as camadas: Vue → pacote compartilhado → Fastify → Prisma → Postgres.

**Blocked by:** None (can start immediately)

**Status:** done

- [x] Monorepo com npm workspaces: web (Vue 3 + Vite + Tailwind), api (Fastify + Prisma) e shared, tudo em TypeScript
- [x] O pacote shared exporta um schema Zod usado pela api para a resposta da rota de saúde e pelo web para tipar o consumo
- [x] A rota de saúde executa uma consulta real no Postgres via Prisma
- [x] Erros da API seguem o formato padrão `{ mensagem, campos? }` (handler global no Fastify)
- [x] `docker compose up` sobe os três serviços; o web consegue falar com a api pela rede do compose
- [x] Prisma com primeira migration aplicada no Postgres local
- [x] Com a api derrubada, a página mostra mensagem de erro amigável em vez de quebrar

## Notas de implementação (concluído em 2026-11-26)

- **Como verificar:** `docker compose up --build` e abrir `localhost:5173`, que deve mostrar "API ok / banco ok". Com `docker compose stop db`, a página mostra "Falha na conexão com o banco de dados." (503). Com `docker compose stop api`, mostra "Não foi possível falar com a API.".
- **Peças:** `Dockerfile.dev` (imagem única para api e web), `.dockerignore`, `compose.yaml` (db com healthcheck; a api roda `prisma migrate deploy` antes do dev; o web usa o proxy `/api` via `API_URL`).
- **Rota de saúde:** `GET /api/health` executa `SELECT 1` via `prisma.$queryRaw`. Os erros passam pelo `setErrorHandler` com `ErroHttp`.
- **Contrato compartilhado:** `saudeSchema`/`erroSchema` em `@clinica/shared`. O web valida a resposta com `parse`/`safeParse`.
- **Detalhes e armadilhas:** `.claude/docs/progresso-ticket-01.md`.
