# Progresso do Ticket 01: Esqueleto local ponta a ponta

## Resumo
Registro da implementação do ticket 01 (`.scratch/clinica-veterinaria/issues/01-esqueleto-local-ponta-a-ponta.md`) e da metodologia de trabalho. **Ticket concluído em 2026-11-26.** Estão prontos o monorepo, o Postgres, a api (Fastify + TS + Prisma 7, com rota de saúde e handler de erros), o shared (Zod), o web (Vue + Vite + Tailwind) e o compose com os três serviços. Próximo: ticket 02 (deploy no Render + Neon). As regras de negócio ficam em `docs/especificacao.md`.

## Metodologia (modo professor, com ritmo ajustado)
- **O usuário escreve todo o código da aplicação.** Claude guia, revisa e explica. Claude só executa limpeza ou verificação (apagar pastas, rodar build, inspecionar arquivos ou containers) quando o usuário pede ou quando é preciso para diagnosticar.
- **Ritmo ajustado em 2026-11-26** (prazo apertado): passos diretos, com trechos prontos para o usuário adaptar e digitar, cada um com um "por quê" curto. Menos perguntas socráticas e menos idas e vindas.
- **Ciclo de cada passo:** trecho com explicação → o usuário digita e roda → "confere?" → Claude revisa (inspeciona arquivos, roda build ou curl) → aponta a correção → commit.
- **Revisões apontam a linha exata e a causa** e explicam a lição geral do erro (ex.: "o `catch` engole qualquer erro").
- **Analogias com Java/Hibernate/Spring** funcionam bem.
- **Commit ao fim de cada unidade completa**, sempre da raiz (`git add -A`) e conferindo o `package-lock.json`. Prefixo `feature:` (escolha do usuário; não sugerir `feat:`).
- **Por quê:** é trabalho de disciplina, e o README declara que o código não foi escrito por IA.

## Fatos Críticos (verbatim, nunca parafrasear)
- **Node:** `v24.17.0` (LTS 24; imagem Docker `node:24-slim`)
- **Pacotes:** `@clinica/api` (apps/api) · `@clinica/web` (apps/web) · `@clinica/shared` (packages/shared)
- **Versões api:** `fastify ^5.12.8` · `@prisma/client ^7.10.1` · `@prisma/adapter-pg ^7.10.1` · `prisma ^7.10.1` · `typescript ^7.0.2` · `tsx ^4.23.15` · `@types/node ^24.19.4` · `dotenv ^17.4.2`
- **Versões web:** `vue ^3.5.46` · `vite ^8.4.0` · `tailwindcss ^4.3.5` + `@tailwindcss/vite ^4.3.5` · `vue-tsc ^3.3.14` · `typescript ~6.0.3` (fixado pelo template) · `@types/node ^24.19.4`
- **Versões shared:** `zod ^4.6.7` · `typescript ^7.0.2` (dev)
- **Workspaces da raiz:** `["apps/*", "packages/*"]` · raiz com `"private": true`
- **Scripts api:** `"dev": "tsx watch --env-file-if-exists=.env ./src/server.ts"` · `"build": "tsc"` · `"start": "node ./dist/server.js"` · `"db:deploy": "prisma migrate deploy"`
- **Scripts web:** `"dev": "vite"` · `"build": "vue-tsc -b && vite build"`
- **Ordem de build:** `npm run build -w @clinica/shared` antes da api e do web (os dois consomem `packages/shared/dist`)
- **Rodar no Windows:** `npm run dev -w @clinica/api` e `npm run dev -w @clinica/web` (terminais separados; o db sobe pelo compose)
- **Rodar tudo no Docker:** `docker compose up --build` → `localhost:5173` (web), `localhost:3000` (api)
- **Compose:** `compose.yaml` com os serviços `db` (postgres:17, volume `postgres_data`, healthcheck `pg_isready`), `api` e `web` (ambos `build: Dockerfile.dev`, context `.`)
- **Variáveis (raiz/.env, modelo em .env.example):** `POSTGRES_DB` · `POSTGRES_USER` · `POSTGRES_PASSWORD` · `POSTGRES_PORT=5435`
- **DATABASE_URL no Windows (apps/api/.env):** `postgresql://vetunif:<senha>@localhost:5435/vetunif`
- **DATABASE_URL no compose:** `postgresql://${POSTGRES_USER:-vetunif}:${POSTGRES_PASSWORD:-vetunif}@db:5432/${POSTGRES_DB:-vetunif}`
- **Proxy do Vite:** `'/api': process.env.API_URL ?? 'http://localhost:3000'` · no compose, `API_URL: http://api:3000`
- **Vite no container:** `npm run dev -w @clinica/web -- --host 0.0.0.0`
- **Comando da api no compose:** `sh -c "npm run db:deploy -w @clinica/api && npm run dev -w @clinica/api"`
- **Rota de saúde:** `GET /api/health` → 200 `{"status":"healthy","dbConnection":"healthy"}` · com o db fora, 503 `{"mensagem":"Falha na conexão com o banco de dados."}`
- **Erros da api:** formato `{ mensagem, campos? }` · classe `ErroHttp(statusCode, mensagem)` em `apps/api/src/models/erros.ts` · `setErrorHandler` + `setNotFoundHandler` em `server.ts` (404 `{"mensagem":"Rota não encontrada."}`)
- **Shared (`packages/shared/src/index.ts`):** exporta `saudeSchema`/`Saude` e `erroSchema`/`Erro` · `exports` com `types: ./dist/index.d.ts` e `default: ./dist/index.js` · `declaration: true`
- **Web (`apps/web/src/App.vue`):** `fetch('/api/health')` → `saudeSchema.parse` no 2xx, `erroSchema.safeParse` no erro, mensagem amigável no `catch` (com `console.error`)
- **Prisma:** config em `apps/api/prisma7.config.ts` · schema em `apps/api/prisma/schema.prisma` · client gerado em `apps/api/src/generated/prisma` (fora do git)
- **Primeira migration:** `20261125195835_setup_cria_tutor_animal` (tabelas `tutor` e `animal`, só `id SERIAL`)
- **Comandos Prisma (de apps/api):** `npx prisma validate` · `npx prisma migrate dev --name <nome>` · `npx prisma generate` · `npx prisma migrate deploy`
- **Instância do client:** `apps/api/src/db.ts` exporta `prisma` (PrismaPg + PrismaClient; falha cedo se a `DATABASE_URL` estiver ausente)
- **Commits do ticket:** de `d3dc6fe` a `d861fdb` ("feature: Compose completo, fim do ticket 01")

## Decisões Tomadas
- **Ordem de montagem**: monorepo → Postgres no compose → api → shared → web → compose completo; cada camada é testada antes da próxima.
- **Entidades entram no seu ticket**: o 01 só cria `tutor` e `animal` com PK, para provar o caminho das migrations; as colunas vêm no 04/05 e a relação Animal → Tutor no 05.
- **PK `Int @default(autoincrement())`**: as rotas exigem login e a permissão é checada no back, então um id adivinhável não dá acesso. Candidato a ADR 0005.
- **Tabelas no singular e em minúsculas via `@@map`**: evita aspas no SQL. Manter o padrão (`usuario`, `atendimento`).
- **ES Modules** (`"type": "module"` + `module: nodenext`): imports relativos com `.js`.
- **tsx no dev, tsc/vue-tsc no build**: o dev não checa tipos; o build é a barreira. Rodar o build antes de commitar.
- **Variáveis vêm do ambiente**: `--env-file-if-exists` no dev; no compose, `environment`. O código só lê `process.env`. O `dotenv` fica só na CLI do Prisma.
- **`--env-file-if-exists` em vez de `--env-file`**: no container não há `.env`, e o `--env-file` encerraria o Node com erro. Quando a variável existe no ambiente, ela prevalece sobre o arquivo.
- **Erros só pelo handler central**: a rota lança `ErroHttp`; o handler loga o erro original (`request.log.error`) e responde `{ mensagem }`. O erro interno nunca vai para o cliente. Erros do Fastify com `statusCode < 500` viram "requisição inválida"; o resto vira 500.
- **`unknown` no handler é estreitado** com `instanceof Error && 'statusCode' in error && typeof error.statusCode === 'number'`, e não com o atalho `setErrorHandler<FastifyError>`.
- **503 para o banco fora**: dependência indisponível não é erro do cliente nem bug.
- **O web valida a resposta com Zod (`parse`/`safeParse`) em vez de `as Saude`**: verificar em vez de afirmar; se a api mudar o formato, o erro aparece claro.
- **Proxy `/api` no Vite**: mesma origem em dev e em prod (ADR 0004), sem CORS.
- **Um `Dockerfile.dev` na raiz para api e web**: o monorepo exige o lockfile da raiz e todos os `package.json` para o `npm ci`. Os `package.json` são copiados antes do código para aproveitar o cache da camada do `npm ci`.
- **`migrate deploy` ao subir a api no compose**: aplica as migrations existentes sem criar novas; com volume novo, as tabelas aparecem sozinhas. O mesmo comando serve para produção.
- **Healthcheck no db + `depends_on: service_healthy`**: o container "sobe" antes de o Postgres aceitar conexões.
- **OpenSSL instalado na imagem `slim`**: a CLI do Prisma procura por ele e avisa quando falta.
- **Sem hot reload no compose, por enquanto**: o compose cumpre o critério do ticket; o dia a dia roda api e web no Windows. Bind mounts podem vir depois, se necessário.
- **TypeScript 6 no web e 7 na api/shared**: o `vue-tsc` ainda depende do 6. Cada workspace tem o seu.
- **Vulnerabilidade `effect` (via prisma CLI) aceita**: só existe em dev; `npm audit --omit=dev` = 0. Não usar `npm audit fix --force`.
- **npm em vez de pnpm**: monorepo simples, sem ferramenta extra.
- **Skills de IA geradas pelo `prisma init` apagadas** de apps/api.

## Pendências / Em Aberto
- **Ticket 02 (deploy Render + Neon)**: decidir quando roda o `prisma migrate deploy` em produção (a CLI é devDependency; o script `db:deploy` já existe), o Dockerfile/build de produção e como a api serve o web compilado na mesma origem.
- Opcional: trocar `==` por `===` no `setErrorHandler` (`server.ts`).
- Opcional: ADR 0005 da PK `Int`; mencionar no PDF a avaliação da vulnerabilidade do `effect`.
- Decidir se atualiza a pendência "versão do Node" em `docs/especificacao.md` (Node 24 LTS).
- Decidir se `.claude/docs/` (este arquivo) fica no git, já que o README declara que o código não foi feito por IA.

## Armadilhas Conhecidas
- **`-D` vale para o comando inteiro**: `npm install a -D b` põe os dois em dev. Use um comando por destino.
- **A tag `latest` do `prisma` aponta para `8.0.0-rc`**: instale `prisma@7` e `@prisma/client@7` juntos.
- **Docs de versão errada**: `prisma contract emit` não existe na 7. A fonte da verdade é `npx prisma --help`.
- **O `prisma init` gera extras** (~200 arquivos de skills e um `.env` `prisma+postgres://`). Olhe o `git status` depois de qualquer gerador e não rode `init` de novo.
- **O Prisma 7 não lê o `.env` sozinho** e o `migrate dev` não roda o `generate`.
- **O exemplo da doc usa `` `${process.env.DATABASE_URL}` ``**: transforma `undefined` em `"undefined"` e anula a checagem.
- **Variáveis de ambiente são `string | undefined`**: use `Number(x ?? padrão)`.
- **Sem `include`, o `tsc` compila todo `.ts` da pasta** e emite `.js` mesmo com erro. `tsc arquivo.ts` ignora o tsconfig.
- **`tsc` compila e sai calado; `tsx` executa.**
- **Interpolação `${}` só funciona com crase.**
- **Barra invertida em script do package.json quebra o JSON.** Use `/`.
- **`localhost` dentro de um container é o próprio container**: use o nome do serviço (`db:5432`, `api:3000`). A porta interna do db é 5432; a 5435 só vale no Windows.
- **Servidor em container precisa ouvir em `0.0.0.0`**: o Fastify usa `host: '0.0.0.0'`; o Vite usa `--host 0.0.0.0`.
- **Variáveis `POSTGRES_*` só valem na primeira inicialização do volume**: para trocar, use `down -v` (apaga os dados). O `down` sem `-v` preserva o banco.
- **`$${VAR}` no compose** deixa a variável para o shell do container; `${VAR}` é resolvido pelo compose a partir do `.env` da raiz.
- **`git add .` só pega a pasta atual**: rode da raiz (`git add -A`) e confira o lockfile.
- **Pasta gerada não é sua**: nunca edite `src/generated/`.
- **O `catch` genérico engole qualquer erro**: `saudeSchemaparse` (sem o ponto) virou "Não foi possível falar com a API.", e a api estava ok. Sempre `console.error(e)`/`log.error` no `catch` e rodar `npm run build` (o `vue-tsc` pega nomes inexistentes).
- **Em TS, use `string`, não `String`** (o wrapper de objeto).
- **Erro de digitação no `.dockerignore` falha em silêncio**: `**/nodde_modules` deixou o `node_modules` do Windows entrar na imagem; o symlink do workspace apontava para `C:/...` e o Vite não achou o `@clinica/shared`. Diagnóstico: `docker compose exec web ls -la node_modules/@clinica`.
- **`rm -rf` de caminho errado não dá erro** (`/ver/lib/...`): confira os caminhos de limpeza.
- **No `create-vite`, o template fixa `@types/node` na versão mais nova**: alinhe com `@types/node@24`.
- **Classe Tailwind com erro de digitação (`felx`) não acusa nada**: o estilo simplesmente não aplica.
- **O Error handler do Fastify recebe `unknown`** na versão atual: estreite o tipo antes de ler `statusCode`.

## Ultima Atualizacao
2026-11-26 — Ticket 01 concluído: handler de erros, shared com Zod, web Vue + Tailwind, compose com três serviços; metodologia com ritmo ajustado; armadilhas de Docker e do `catch`.
