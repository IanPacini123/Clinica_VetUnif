# Progresso do Ticket 01: Esqueleto local ponta a ponta

## Resumo
Andamento da implementação do ticket 01 (`.scratch/clinica-veterinaria/issues/01-esqueleto-local-ponta-a-ponta.md`) e a metodologia de trabalho combinada. O monorepo, o Postgres no compose, a api Fastify com TypeScript e o Prisma 7 (com migration e client) estão prontos. Faltam a rota de saúde consultando o banco, o handler de erros, o `shared` com Zod, o `web` em Vue e o compose com 3 serviços. Regras de negócio e decisões de produto ficam em `docs/especificacao.md`.

## Metodologia (modo professor)
- **Claude atua como professor, não como implementador**: o usuário escreve todo o código; Claude faz perguntas, dá dicas, aponta docs e revisa o que foi escrito.
- **Um passo por vez**: perguntar antes de explicar; pedir previsão antes de rodar um comando ("o que você espera que apareça?") e comparar depois.
- **Claude só executa ações de limpeza ou verificação** quando o usuário pede (apagar pastas, rodar build, inspecionar arquivos); nunca escreve código da aplicação.
- **Analogias com Java/Hibernate/Spring** funcionam bem (usuário conhece ORM via Hibernate).
- **Revisões apontam o problema e a pista, não a correção pronta**; código pronto só quando o usuário pede explicitamente (ex.: posição do `include` no tsconfig).
- **Commit ao fim de cada unidade completa**; prefixo `feature:` (escolha do usuário, não sugerir `feat:`).
- Por que: é trabalho de disciplina e o README declara que o código não foi escrito por IA.

## Fatos Críticos (verbatim, nunca parafrasear)
- **Node:** `v24.17.0` (LTS 24; Docker deve usar `node:24-*`)
- **Versões api:** `fastify ^5.12.8` · `@prisma/client ^7.10.1` · `@prisma/adapter-pg ^7.10.1` · `prisma ^7.10.1` · `typescript ^7.0.2` · `tsx ^4.23.15` · `@types/node ^24.19.4` · `dotenv ^17.4.2`
- **Nomes dos pacotes:** `@clinica/api` (apps/api) · `@clinica/shared` (packages/shared) · web ainda não criado
- **Workspaces da raiz:** `["apps/*", "packages/*"]` · raiz com `"private": true`
- **Compose:** arquivo `compose.yaml`, serviço `db`, imagem `postgres:17`, volume `postgres_data`, rede `clinica_vetunif_default`
- **Variáveis (raiz/.env, modelo em .env.example):** `POSTGRES_DB` · `POSTGRES_USER` · `POSTGRES_PASSWORD` · `POSTGRES_PORT=5435`
- **DATABASE_URL (apps/api/.env, api rodando no Windows):** `postgresql://vetunif:<senha>@localhost:5435/vetunif`
- **DATABASE_URL (api dentro do compose):** `postgresql://vetunif:<senha>@db:5432/vetunif`
- **Scripts api:** `"dev": "tsx watch --env-file=.env ./src/server.ts"` · `"build": "tsc"` · `"start": "node ./dist/server.js"`
- **Rodar da raiz:** `npm run dev -w @clinica/api`
- **Rota de saúde:** `GET /api/health` (hoje responde `{status: 'Running'}` sem consultar o banco)
- **Listen:** `{ port: Number(process.env.PORT ?? 3000), host: '0.0.0.0' }`
- **Prisma:** config em `apps/api/prisma7.config.ts` · schema em `apps/api/prisma/schema.prisma` · client gerado em `apps/api/src/generated/prisma` (ignorado pelo git)
- **Primeira migration:** `20261125195835_setup_cria_tutor_animal` (tabelas `tutor` e `animal`, só `id SERIAL`)
- **Comandos Prisma (de apps/api):** `npx prisma validate` · `npx prisma migrate dev --name <nome>` · `npx prisma generate`
- **Instância do client:** `apps/api/src/db.ts` exporta `prisma` (PrismaPg + PrismaClient, falha cedo se `DATABASE_URL` ausente)

## Decisões Tomadas
- **Ordem de montagem**: monorepo → Postgres no compose → api → shared → web → compose completo; testa cada camada antes da próxima.
- **Entidades entram no seu ticket**: 01 só cria `tutor` e `animal` com PK, para provar o caminho das migrations antes do Neon no 02; colunas no 04/05; relação Animal → Tutor no 05.
- **PK `Int @default(autoincrement())`**: todas as rotas exigem login e a permissão é checada no back; id adivinhável não dá acesso (segurança não depende de obscuridade). Candidato a ADR 0005.
- **Tabelas no singular e minúsculas via `@@map`** (`tutor`, `animal`): evita aspas no SQL; manter o padrão (`usuario`, `atendimento`).
- **ES Modules** (`"type": "module"` + `module: nodenext`): padrão da linguagem; Vite/Vue/Zod são ESM. Imports relativos com extensão `.js`.
- **tsconfig da api**: `rootDir ./src`, `outDir ./dist`, `target ES2024` (acompanha o Node 24), `types ["node"]`, `strict`, `include ["src"]`.
- **tsx no dev, tsc no build**: tsx não checa tipos e é devDependency; tsc é a barreira de tipos e roda uma vez no build.
- **`.env` carregado por `--env-file`, não por dotenv no código**: o código só lê `process.env`; quem fornece as variáveis é o ambiente. `dotenv` fica só para a CLI do Prisma (importado no `prisma7.config.ts`).
- **Dois `.env`**: raiz para o compose (credenciais do container); `apps/api/.env` para a api no Windows.
- **Porta publicada configurável** (`POSTGRES_PORT`): evita conflito com outro serviço na 5432.
- **Vulnerabilidade `effect` (via prisma CLI) aceita**: só em dev e sem entrada externa; `npm audit --omit=dev` = 0. Não usar `npm audit fix --force` (rebaixaria o prisma para a 6).
- **npm em vez de pnpm**: monorepo simples sem ferramenta extra.
- **Skills de IA geradas pelo `prisma init` apagadas** (`.agents`, `.claude`, `.windsurf`, `skills-lock.json` em apps/api).

## Pendências / Em Aberto
Falta para fechar o ticket 01 (em ordem):
- **Commit pendente**: `apps/api/src/db.ts`, `apps/api/tsconfig.json` (include), `apps/api/package.json` (adapter-pg), `package-lock.json`. Fazer push depois (prazo de commits 27/11).
- **Rota de saúde com banco**: usar `prisma.$queryRaw` com `SELECT 1` em `/api/health`; responder 503 no formato `{ mensagem }` com o banco fora; testar com `docker compose stop db`.
- **Handler global de erros** no Fastify no formato `{ mensagem, campos? }`.
- **packages/shared**: TypeScript, ESM, schema Zod da resposta de saúde usado pela api e pelo web.
- **apps/web**: `npm create vite@latest` (Vue + TS) em `apps/web`, Tailwind, página que chama `/api/health` e mostra "API ok / banco ok" ou erro amigável.
- **Compose completo**: serviços `api` e `web` com Dockerfiles de dev; `DATABASE_URL` com `db:5432` no `environment` da api.
- **Marcar os critérios** no arquivo do ticket 01 e mudar o Status para em andamento/concluído.
- Para o ticket 02: decidir em que momento do deploy roda o `prisma migrate deploy` (CLI e dotenv são devDependencies).
- Opcional: ADR 0005 da PK `Int`; mencionar no PDF a avaliação da vulnerabilidade do `effect`.
- Decidir se `.claude/docs/` (este arquivo) vai para o git, dado o README declarar que não há código feito com IA.

## Armadilhas Conhecidas
- **`-D` vale para o comando inteiro**: `npm install a -D b` põe os dois em dev. Um comando por destino.
- **Tag `latest` do pacote `prisma` aponta para `8.0.0-rc`**: instalar sempre `prisma@7` e `@prisma/client@7` juntos; CLI e client na mesma versão.
- **Docs de versão errada**: `prisma contract emit` não existe na 7. Conferir a versão instalada e usar `npx prisma --help` como fonte da verdade.
- **`prisma init` gera extras**: ~200 arquivos de skills de IA e um `.env` com URL `prisma+postgres://` de exemplo. Sempre olhar o `git status` depois de um gerador. Não rodar `init` de novo.
- **Prisma 7 não lê `.env` sozinho** e o `migrate dev` não roda o `generate`: são passos separados.
- **Exemplo da doc usa `` `${process.env.DATABASE_URL}` ``**: transforma `undefined` em `"undefined"` e anula a checagem. Ler `process.env` direto e tratar com `if` + `throw`.
- **Variáveis de ambiente são `string | undefined`**: converter com `Number(x ?? padrão)` (padrão antes da conversão; `Number(undefined)` é `NaN`).
- **Sem `include`, o `tsc` compila todo `.ts` da pasta** (pegou o `prisma7.config.ts`) e emite `.js` mesmo com erro.
- **`tsc arquivo.ts` ignora o tsconfig**; `--ignoreConfig` gera `.js` ao lado do fonte. Usar só `tsc`.
- **`tsc` compila e sai calado; `tsx` executa.** Rodar o servidor com `tsx`.
- **Interpolação `${}` só funciona com crase**, não com aspas simples ou duplas.
- **Barra invertida em scripts do package.json quebra o JSON** (`\s` é escape inválido) e não funciona no Linux. Usar `/`.
- **`localhost` dentro de container é o próprio container**: na rede do compose, usar o nome do serviço (`db:5432`).
- **Variáveis `POSTGRES_*` só valem na primeira inicialização do volume**: para trocar a senha, `docker compose down -v` (apaga os dados) ou `ALTER USER`.
- **`git add .` só pega a pasta atual**: rodar da raiz ou usar `git add -A`; conferir se o `package-lock.json` entrou.
- **Pasta gerada não é sua**: nunca criar arquivos em `src/generated/`; ela fica fora do git, mas precisa ser compilada para o `dist/`.

## Ultima Atualizacao
2026-11-25 — Criação: progresso do ticket 01 (monorepo, compose com Postgres, api Fastify/TS, Prisma 7 com migration e client) e a metodologia modo professor.
