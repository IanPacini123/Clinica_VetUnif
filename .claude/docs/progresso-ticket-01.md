# Progresso da Implementação: Tickets 01 e 02

## Resumo
Registro da implementação e da metodologia de trabalho. Tickets em `.scratch/clinica-veterinaria/issues/`. **Ticket 01** (esqueleto local) foi concluído em 2026-11-26. **Ticket 02** (esqueleto publicado) foi concluído em 2026-11-26 em `https://clinica-vetunif.onrender.com/`, com deploy automático por push confirmado. Próximo: ticket 03 (login e sessão). As regras de negócio ficam em `docs/especificacao.md`; o deploy, no ADR 0004.

## Metodologia (modo professor, com ritmo ajustado)
- **O usuário escreve todo o código da aplicação.** Claude guia, revisa e explica. Claude só executa limpeza, verificação (build, curl, inspecionar arquivos ou containers) e documentação quando o usuário pede ou quando é preciso para diagnosticar.
- **Ritmo desde 2026-11-26:** passos diretos com trechos prontos para o usuário adaptar e digitar, cada um com um "por quê" curto; menos perguntas socráticas.
- **Ciclo de cada passo:** trecho com explicação → o usuário digita e roda → "confere?" → Claude revisa → aponta a linha exata, a causa e a lição geral → commit.
- **O ticket é dividido em código local primeiro, depois plataformas** (no 02: static + Dockerfile testados localmente antes do Neon/Render).
- **Analogias com Java/Hibernate/Spring** funcionam bem.
- **Commit ao fim de cada unidade**, sempre da raiz (`git add -A`), conferindo o `package-lock.json`. Prefixo `feature:` (escolha do usuário; não sugerir `feat:`). O usuário também usa `docs:` e `fix:`.
- **O status do ticket é marcado pelo próprio usuário** quando ele pede (no 02, ele mesmo vai commitar).
- **Por quê:** é trabalho de disciplina, e o README declara que o código não foi escrito por IA.

## Fatos Críticos (verbatim, nunca parafrasear)
- **URL pública:** `https://clinica-vetunif.onrender.com/`
- **Repositório:** `https://github.com/IanPacini123/Clinica_VetUnif` (público)
- **Node:** `v24.17.0` (LTS 24; imagens `node:24-slim` com `openssl` instalado)
- **Pacotes:** `@clinica/api` (apps/api) · `@clinica/web` (apps/web) · `@clinica/shared` (packages/shared)
- **Dependências da api:** `fastify ^5.12.8` · `@fastify/static ^11.0.0` · `@prisma/client ^7.10.1` · `@prisma/adapter-pg ^7.10.1` · `prisma ^7.10.1` · `dotenv ^17.4.2` · `@clinica/shared ^1.0.0`
- **devDependencies da api:** `typescript ^7.0.2` · `tsx ^4.23.15` · `@types/node ^24.19.4`
- **Versões web:** `vue ^3.5.46` · `vite ^8.4.0` · `tailwindcss ^4.3.5` + `@tailwindcss/vite` · `vue-tsc ^3.3.14` · `typescript ~6.0.3` (fixado pelo template) · `@types/node ^24.19.4`
- **Versões shared:** `zod ^4.6.7` · `typescript ^7.0.2` (dev)
- **Workspaces da raiz:** `["apps/*", "packages/*"]` · raiz com `"private": true`
- **Scripts api:** `"dev": "tsx watch --env-file-if-exists=.env ./src/server.ts"` · `"build": "tsc"` · `"start": "node ./dist/server.js"` · `"db:deploy": "prisma migrate deploy"`
- **Scripts web:** `"dev": "vite"` · `"build": "vue-tsc -b && vite build"`
- **Ordem de build:** shared → `prisma generate` → web → api
- **Rodar no Windows:** `npm run dev -w @clinica/api` e `npm run dev -w @clinica/web` (o db sobe pelo compose)
- **Compose local:** `docker compose up --build` → `localhost:5173` (web), `localhost:3000` (api). Serviços `db` (postgres:17, volume `postgres_data`, healthcheck `pg_isready`), `api` e `web` (ambos `Dockerfile.dev`)
- **Imagem de produção local:** `docker build -t clinica-prod .` · `docker run --rm -p 3000:3000 -e DATABASE_URL="..." clinica-prod` → `localhost:3000`
- **DATABASE_URL para a imagem local com o db do compose:** `postgresql://vetunif:<senha>@host.docker.internal:5435/vetunif`
- **Arquivos Docker na raiz:** `Dockerfile` (produção, multi-stage: `build` → runtime com `npm ci --omit=dev`) · `Dockerfile.dev` (compose) · `.dockerignore` (`**/node_modules`, `**/dist`, `**/.env`, `apps/api/src/generated`, `.git`)
- **CMD de produção:** `sh -c "npm run db:deploy -w @clinica/api && npm start -w @clinica/api"`
- **Artefatos copiados para o runtime:** `packages/shared/dist`, `apps/api/dist`, `apps/api/prisma`, `apps/api/prisma7.config.ts`, `apps/web/dist`
- **Static no Fastify:** `WEB_DIST = fileURLToPath(new URL('../../web/dist', import.meta.url))`; registra o `@fastify/static` só se `existsSync(WEB_DIST)`; o not found devolve `index.html` para GET fora de `/api`
- **Render:** Web Service, Docker, branch `main`, região Ohio, Free, Dockerfile `./Dockerfile`, Health Check `/api/health`, Auto-Deploy On Commit, env `DATABASE_URL` e `JWT_SECRET` (gerado pelo Render; ainda não lido pelo código). O `PORT` é injetado pelo Render (10000)
- **Neon:** projeto em AWS US East 2 (Ohio), Postgres 17, URL **direta** (sem pooling) com `sslmode=require`
- **Variáveis (raiz/.env, modelo em .env.example):** `POSTGRES_DB` · `POSTGRES_USER` · `POSTGRES_PASSWORD` · `POSTGRES_PORT=5435`
- **DATABASE_URL no Windows (apps/api/.env):** `postgresql://vetunif:<senha>@localhost:5435/vetunif`
- **DATABASE_URL no compose:** `postgresql://${POSTGRES_USER:-vetunif}:${POSTGRES_PASSWORD:-vetunif}@db:5432/${POSTGRES_DB:-vetunif}`
- **Proxy do Vite:** `'/api': process.env.API_URL ?? 'http://localhost:3000'` · no compose, `API_URL: http://api:3000` e `--host 0.0.0.0`
- **Rota de saúde:** `GET /api/health` → 200 `{"status":"healthy","dbConnection":"healthy"}` · com o db fora, 503 `{"mensagem":"Falha na conexão com o banco de dados."}`
- **Erros da api:** `{ mensagem, campos? }` · `ErroHttp(statusCode, mensagem)` em `apps/api/src/models/erros.ts` · `setErrorHandler` + `setNotFoundHandler` (404 `{"mensagem":"Rota não encontrada."}`)
- **Shared:** `saudeSchema`/`Saude`, `erroSchema`/`Erro` · `exports` com `types: ./dist/index.d.ts`, `default: ./dist/index.js`
- **Web (`App.vue`):** `fetch('/api/health')` → `saudeSchema.parse` / `erroSchema.safeParse` / `catch` com `console.error` e mensagem amigável
- **Prisma:** config `apps/api/prisma7.config.ts` · schema `apps/api/prisma/schema.prisma` · client em `apps/api/src/generated/prisma` (fora do git, compilado para `dist/generated`)
- **Migrations:** `20261125195835_setup_cria_tutor_animal` (tabelas `tutor` e `animal`, só `id SERIAL`), aplicada no local e no Neon
- **Comandos Prisma (de apps/api):** `npx prisma validate` · `npx prisma migrate dev --name <nome>` · `npx prisma generate` · `npx prisma migrate deploy`
- **Commits:** ticket 01 de `d3dc6fe` a `d861fdb` · ticket 02 `485a806` ("feature: configuracao para deploy") e `508054a` ("fix: correcao de typo")

## Decisões Tomadas
- **Ordem de montagem**: monorepo → Postgres → api → shared → web → compose; cada camada é testada antes da próxima.
- **Entidades entram no seu ticket**: o 01 só cria `tutor` e `animal` com PK; as colunas vêm no 04/05 e a relação no 05.
- **PK `Int @default(autoincrement())`**: a permissão é checada no back, então um id adivinhável não dá acesso. Candidato a ADR 0005.
- **Tabelas no singular e em minúsculas via `@@map`**: evita aspas no SQL.
- **ES Modules** (`"type": "module"` + `nodenext`): imports relativos com `.js`; `await` no topo é permitido.
- **tsx no dev, tsc/vue-tsc no build**: o dev não checa tipos. Rodar o build localmente antes de commitar e antes do `docker build`.
- **Variáveis vêm do ambiente**: `--env-file-if-exists` no dev; `environment` no compose; painel no Render. O código só lê `process.env`.
- **`--env-file-if-exists`**: no container não há `.env`, e o `--env-file` encerraria o Node com erro; a variável do ambiente prevalece sobre a do arquivo.
- **Erros só pelo handler central**: a rota lança `ErroHttp`; o handler loga o erro original e responde `{ mensagem }`; o `unknown` é estreitado com `instanceof`/`in`/`typeof` (não `setErrorHandler<FastifyError>`).
- **503 para o banco fora**: dependência indisponível não é erro do cliente.
- **O web valida a resposta com Zod**, em vez de `as Saude`: verificar em vez de afirmar.
- **Mesma origem em dev e prod**: proxy `/api` no Vite; em prod, o Fastify serve o Vue (ADR 0004). Sem CORS.
- **`existsSync(WEB_DIST)`**: a api roda em dev sem o build do web; só serve o front quando ele existe.
- **Caminho via `import.meta.url`**: resolve a partir do arquivo, e não do cwd; funciona igual de `src/` e de `dist/`.
- **Fallback para `index.html` só em GET fora de `/api`**: o Vue Router em modo history resolve no cliente; a api continua com o 404 em JSON.
- **`Dockerfile.dev` e `Dockerfile` separados**: o de dev é usado pelo compose (tem as devDependencies, roda tsx e vite); o de prod é multi-stage e só leva artefatos e as dependências de produção.
- **Multi-stage**: o estágio de build tem os compiladores; o runtime começa limpo com `npm ci --omit=dev` e copia só os `dist`. A imagem local tem ~795 MB.
- **`prisma` e `dotenv` em `dependencies`**: a migration roda na inicialização do container (o Render Free não tem pre-deploy), então a CLI precisa estar na imagem final. Consequência: o alerta do `effect` agora aparece no `npm audit --omit=dev`. O risco foi aceito porque a CLI só roda o `migrate deploy` sem entrada externa.
- **`migrate deploy && start`**: se a migration falhar, o servidor não sobe com o schema errado; o `migrate deploy` é idempotente (via `_prisma_migrations`).
- **Neon e Render na mesma região (Ohio)**: o Render Free não tem região no Brasil; a latência api↔banco pesa em cada consulta (~120–150 ms entre Ohio e São Paulo, contra 1–2 ms na mesma região). O projeto do Neon criado em São Paulo foi excluído e recriado.
- **URL direta do Neon, sem pooler**: o PgBouncer em modo transaction atrapalha os locks de sessão do `migrate deploy`; para este volume, a conexão direta basta.
- **`JWT_SECRET` já no Render**: o critério pede o segredo fora do repositório desde já; o código só vai lê-lo no ticket 03.
- **Health check do Render em `/api/health`**: o deploy só fica live se a api e o banco responderem.
- **Sem hot reload no compose**: o dia a dia roda api e web no Windows.
- **TypeScript 6 no web e 7 na api/shared**: o `vue-tsc` ainda depende do 6.
- **npm em vez de pnpm**; skills de IA geradas pelo `prisma init` foram apagadas.

## Pendências / Em Aberto
- **Ticket 03 (login e sessão)**: o código passa a ler o `JWT_SECRET` (falhar cedo se ausente, como a `DATABASE_URL`); também precisa ser adicionado ao `apps/api/.env` local e ao compose.
- **PDF**: avisar que o Render Free hiberna (~50 s na primeira visita) e registrar a avaliação da vulnerabilidade do `effect`, que agora está nas dependências de produção.
- Opcional: ADR 0005 da PK `Int`; atualizar a pendência "versão do Node" em `docs/especificacao.md` (Node 24 LTS); reduzir a imagem (hoje o `npm ci --omit=dev` instala também as dependências de runtime do web, como o `vue`, que não são usadas).
- Decidir se `.claude/docs/` fica no git, dado o que o README declara sobre IA.

## Armadilhas Conhecidas
- **`-D` vale para o comando inteiro**; **flag com erro de digitação é ignorada só com um aviso** (`--saved-prod` → install comum, os pacotes continuaram em dev). Confira o `package.json` depois de cada install.
- **`npm install --save-prod <pkg>`** move de devDependencies para dependencies.
- **A tag `latest` do `prisma` é `8.0.0-rc`**: use `prisma@7` e `@prisma/client@7`.
- **Docs de versão errada** (`prisma contract emit` não existe na 7): a fonte da verdade é `npx prisma --help`.
- **O `prisma init` gera extras** (skills de IA, `.env` `prisma+postgres://`): olhe o `git status` depois de qualquer gerador.
- **O Prisma 7 não lê o `.env` sozinho**, e o `migrate dev` não roda o `generate`.
- **`` `${process.env.X}` `` transforma `undefined` em `"undefined"`** e anula a checagem.
- **Variáveis de ambiente são `string | undefined`**: `Number(x ?? padrão)`.
- **Sem `include`, o `tsc` compila tudo da pasta**; `tsc arquivo.ts` ignora o tsconfig; `tsc` só compila, `tsx` executa.
- **Interpolação `${}` só com crase**; barra invertida em script do package.json quebra o JSON.
- **`localhost` dentro de um container é o próprio container**: use o nome do serviço (`db:5432`, `api:3000`) ou `host.docker.internal` para alcançar o Windows fora do compose.
- **Servidor em container precisa ouvir em `0.0.0.0`** (Fastify `host`, Vite `--host`).
- **`POSTGRES_*` só vale na primeira inicialização do volume**; o `down` sem `-v` preserva o banco.
- **`$${VAR}` no compose** deixa a variável para o shell do container.
- **`git add .` só pega a pasta atual**: use `git add -A` da raiz.
- **Nunca editar `src/generated/`.**
- **`catch` genérico engole qualquer erro**: `saudeSchemaparse` (sem o ponto) virou "Não foi possível falar com a API". Faça log no `catch` e rode o build.
- **`string`, não `String`**, em TS; classe Tailwind com erro (`felx`) falha em silêncio.
- **Erro de digitação no `.dockerignore` falha em silêncio** (`nodde_modules`): o `node_modules` do Windows entrou na imagem com symlinks `C:/...`. Diagnóstico: `docker compose exec web ls -la node_modules/@clinica`.
- **`rm -rf` de caminho errado (`/ver/...`) não dá erro.**
- **Import sem espaço (`import fastifyStaticfrom '...'`)** gera `TS1005: '=' expected`. A mensagem engana; olhe a linha.
- **Erro de compilação descoberto no `docker build` custa ~30 s**; o build local custa ~2 s.
- **O nome do Dockerfile de produção é `Dockerfile`** (padrão do `docker build .` e do Render); outros nomes exigem `-f`/`dockerfile:`.
- **Região do Neon não muda depois de criado**: escolha antes. Projeto excluído invalida a URL e a senha antigas.
- **Não criar `PORT` no Render**: ele injeta a variável, e o `server.ts` lê `process.env.PORT`.
- **A URL do Neon contém a senha**: só no painel do Render; nunca no chat, no commit ou em `.env` versionado.
- **No `create-vite`, o `@types/node` vem na versão mais nova**: alinhe com `@24`.
- **O error handler do Fastify recebe `unknown`**: estreite antes de ler `statusCode`.

## Ultima Atualizacao
2026-11-26 — Ticket 02 concluído; auto-deploy confirmado e `===` corrigido. Ticket 02 publicado (Fastify static + fallback, Dockerfile multi-stage, Neon Ohio, Render com health check e auto-deploy); armadilhas de npm, região e import.
