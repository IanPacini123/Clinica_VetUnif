# Progresso da Implementação: Tickets 01 a 03

## Resumo
Registro da implementação e da metodologia de trabalho. Tickets em `.scratch/clinica-veterinaria/issues/`. **Ticket 01** (esqueleto local), **02** (esqueleto publicado em `https://clinica-vetunif.onrender.com/`, com deploy automático por push) e **03** (login e sessão) foram concluídos em 2026-11-26. O 03 foi verificado na URL publicada, mas o status no arquivo do ticket ainda está `ready-for-agent`, e o próprio usuário vai marcá-lo. Próximo: ticket 04 (CRUD de tutor). As regras de negócio ficam em `docs/especificacao.md`; o deploy, no ADR 0004.

## Metodologia (modo professor, com ritmo ajustado)
- **O usuário escreve todo o código da aplicação.** Claude guia, revisa e explica. Claude só executa limpeza, verificação (build, curl, inspecionar arquivos ou containers) e documentação quando o usuário pede ou quando é preciso para diagnosticar.
- **Ritmo:** passos diretos com trechos prontos para o usuário adaptar e digitar, cada um com um "por quê" curto; menos perguntas socráticas. Ao "confere", Claude revisa o código de verdade (`git status`, os arquivos, o build) e não só a saída colada pelo usuário: no 03, assim foram achados o `'api/sessao'` sem `/` e o static antes dos handlers.
- **Ciclo de cada passo:** trecho com explicação → o usuário digita e roda → "confere?" → Claude revisa → aponta a linha exata, a causa e a lição geral → commit.
- **O ticket é dividido em unidades, primeiro o código local, depois as plataformas.** No 03: banco → seed → login → proteção → web (sessão) → layout → publicação.
- **Quando há uma escolha de escopo**, Claude dá uma recomendação e o usuário escolhe (no 03: telas vazias no menu agora, opção a).
- **Analogias com Java/Hibernate/Spring** funcionam bem.
- **Commit ao fim de cada unidade**, sempre da raiz (`git add -A`), conferindo o `package-lock.json`. Prefixo `feature:` (escolha do usuário; não sugerir `feat:`). O usuário também usa `docs:` e `fix:`.
- **O status do ticket é marcado pelo próprio usuário.**
- **Por quê:** é trabalho de disciplina, e o README declara que o código não foi escrito por IA.

## Fatos Críticos (verbatim, nunca parafrasear)
- **URL pública:** `https://clinica-vetunif.onrender.com/`
- **Repositório:** `https://github.com/IanPacini123/Clinica_VetUnif` (público)
- **Node:** `v24.17.0` (LTS 24; imagens `node:24-slim` com `openssl` instalado)
- **Pacotes:** `@clinica/api` (apps/api) · `@clinica/web` (apps/web) · `@clinica/shared` (packages/shared)
- **Dependências da api:** `fastify ^5.12.8` · `@fastify/static ^11.0.0` · `@fastify/jwt ^10.2.9` · `bcryptjs ^3.0.3` · `@prisma/client ^7.10.1` · `@prisma/adapter-pg ^7.10.1` · `prisma ^7.10.1` · `dotenv ^17.4.2` · `@clinica/shared ^1.0.0`
- **devDependencies da api:** `typescript ^7.0.2` · `tsx ^4.23.15` · `@types/node ^24.19.4`
- **Versões web:** `vue ^3.5.46` · `vue-router ^5.5.3` · `vite ^8.4.0` · `tailwindcss ^4.3.5` + `@tailwindcss/vite` · `vue-tsc ^3.3.14` · `typescript ~6.0.3` (fixado pelo template) · `@types/node ^24.19.4`
- **Versões shared:** `zod ^4.6.7` · `typescript ^7.0.2` (dev)
- **Workspaces da raiz:** `["apps/*", "packages/*"]` · raiz com `"private": true`
- **Scripts api:** `"dev": "tsx watch --env-file-if-exists=.env ./src/server.ts"` · `"build": "tsc"` · `"start": "node ./dist/server.js"` · `"db:deploy": "prisma migrate deploy"` · `"seed:dev": "tsx --env-file-if-exists=.env ./src/seed.ts"` · `"db:seed": "node ./dist/seed.js"`
- **Scripts web:** `"dev": "vite"` · `"build": "vue-tsc -b && vite build"`
- **Ordem de build:** shared → `prisma generate` → web → api
- **Rodar no Windows:** `npm run dev -w @clinica/api` e `npm run dev -w @clinica/web` (o db sobe com `docker compose up db -d`)
- **Compose local (`compose.yaml`):** `docker compose up --build` → `localhost:5173` (web), `localhost:3000` (api). Serviços `db` (postgres:17, volume `postgres_data`, healthcheck `pg_isready`), `api` e `web` (ambos `Dockerfile.dev`). Command da api: `db:deploy && seed:dev && dev`; env `JWT_SECRET: ${JWT_SECRET:-segredo-local-so-para-dev}` e `ADMIN_SENHA: ${ADMIN_SENHA:-admin12345}`
- **Imagem de produção local:** `docker build -t clinica-prod .` · `docker run --rm --name clinica-prod-teste -p 3000:3000 -e DATABASE_URL="..." -e JWT_SECRET="teste" -e ADMIN_SENHA="12345678" clinica-prod` · parar com `docker stop clinica-prod-teste`
- **DATABASE_URL para a imagem local com o db do compose:** `postgresql://vetunif:<senha>@host.docker.internal:5435/vetunif`
- **Arquivos Docker na raiz:** `Dockerfile` (produção, multi-stage: `build` → runtime com `npm ci --omit=dev`) · `Dockerfile.dev` (compose) · `.dockerignore` (`**/node_modules`, `**/dist`, `**/.env`, `apps/api/src/generated`, `.git`)
- **CMD de produção:** `sh -c "npm run db:deploy -w @clinica/api && npm run db:seed -w @clinica/api && npm start -w @clinica/api"`
- **Artefatos copiados para o runtime:** `packages/shared/dist`, `apps/api/dist` (inclui `seed.js`), `apps/api/prisma`, `apps/api/prisma7.config.ts`, `apps/web/dist`
- **Render:** Web Service, Docker, branch `main`, região Ohio, Free, Dockerfile `./Dockerfile`, Health Check `/api/health`, Auto-Deploy On Commit, env `DATABASE_URL`, `JWT_SECRET` (gerado pelo Render) e `ADMIN_SENHA` (forte, diferente da local). O `PORT` é injetado pelo Render (10000)
- **Neon:** projeto em AWS US East 2 (Ohio), Postgres 17, URL **direta** (sem pooling) com `sslmode=require`
- **Variáveis (raiz/.env, modelo em .env.example):** `POSTGRES_DB` · `POSTGRES_USER` · `POSTGRES_PASSWORD` · `POSTGRES_PORT=5435`
- **apps/api/.env:** `DATABASE_URL=postgresql://vetunif:<senha>@localhost:5435/vetunif` · `JWT_SECRET=...` · `ADMIN_SENHA=...`
- **DATABASE_URL no compose:** `postgresql://${POSTGRES_USER:-vetunif}:${POSTGRES_PASSWORD:-vetunif}@db:5432/${POSTGRES_DB:-vetunif}`
- **Proxy do Vite:** `'/api': process.env.API_URL ?? 'http://localhost:3000'` · no compose, `API_URL: http://api:3000` e `--host 0.0.0.0`
- **Ordem no `server.ts`:** `Fastify()` → `setErrorHandler` → `setNotFoundHandler` → `addHook('onRequest', autenticar)` → `register(fastifyJwt, { secret, sign: { expiresIn: '8h' } })` → `register(rotasAuth)` → `register(fastifyStatic)` (se `servirWeb`) → `start()`
- **Rotas da api:** `GET /api/health` (pública) · `POST /api/login` (pública) · `GET /api/sessao` (devolve `{ id, nome, nomeUsuario, perfil }` do token)
- **Login:** 400 `Informe usuário e senha.` · 401 `Usuário ou senha inválidos.` (usuário inexistente ou senha errada) · 403 `Usuário foi inativado. Procure o administrador.` · 200 `{ token, usuario }`
- **Proteção (`apps/api/src/auth/guards.ts`):** `ROTAS_PUBLICAS = new Set(['/api/login', '/api/health'])`, comparada com `request.routeOptions.url`; fora de `/api/` passa direto · 401 `Sessão expirada ou inválida. Entre novamente.` · `exigirPerfil(...perfis)` no `preHandler` → 403 `Você não tem a permissão para esta ação.`
- **Arquivos de auth da api:** `src/auth/senha.ts` (`gerarHash`, `conferirSenha`, bcrypt `CUSTO = 10`) · `src/auth/tipos.ts` (`declare module '@fastify/jwt'`, payload e user = `UsuarioSessao`) · `src/rotas/auth.ts` (`rotasAuth`) · `src/seed.ts` (`upsert` de `admin` com `update: {}`)
- **Payload do JWT:** `id`, `nome`, `nomeUsuario`, `perfil`, `iat`, `exp` (`exp - iat = 28800`)
- **Rota de saúde:** 200 `{"status":"healthy","dbConnection":"healthy"}` · com o db fora, 503 `{"mensagem":"Falha na conexão com o banco de dados."}`
- **Erros da api:** `{ mensagem, campos? }` · `ErroHttp(statusCode, mensagem)` em `apps/api/src/models/erros.ts` · 404 `{"mensagem":"Rota não encontrada."}`
- **Shared:** `saudeSchema`, `erroSchema`, `perfilSchema`, `loginSchema` (só não vazio), `usuarioSessaoSchema`, `respostaLoginSchema` + tipos `Saude`, `Erro`, `Perfil`, `Login`, `UsuarioSessao`, `RespostaLogin` · `exports` com `types: ./dist/index.d.ts`, `default: ./dist/index.js`
- **Web:** `src/sessao/session.ts` (`token`, `usuario`, `salvarSessao`, `encerrarSessao`, `podeAcessar`; localStorage chave `token`) · `src/api.ts` (`api(caminho, schema, opcoes)`, `ErroApi`) · `src/router.ts` (`telas`, `router`, `RouteMeta { publica, titulo, perfis }`) · `src/perfis.ts` (`NOME_PERFIL`) · `src/components/AppLayout.vue` · `src/views/` (`LoginView`, `RecepcaoView`, `TutoresView`, `AnimaisView`, `UsuariosView`)
- **Rotas do web:** `/login` (pública, fora do layout) · filhas do layout: `/` (`recepcao`), `/tutores`, `/animais`, `/usuarios` (`perfis: ['ADMIN']`) · `/:caminho(.*)*` → `/`
- **Prisma:** config `apps/api/prisma7.config.ts` · schema `apps/api/prisma/schema.prisma` · client em `apps/api/src/generated/prisma` (fora do git, compilado para `dist/generated`)
- **Model `Usuario` (tabela `usuario`):** `id`, `nome`, `nomeUsuario @unique @map("nome_usuario")`, `senhaHash @map("senha_hash")`, `perfil Perfil`, `crmv String?`, `ativo Boolean @default(true)` · enum `Perfil` (`ADMIN`, `ATENDENTE`, `VETERINARIO`) com `@@map("perfil")`
- **Migrations:** `20261125195835_setup_cria_tutor_animal` · `20261126192159_cria_usuario`; ambas aplicadas no local e no Neon
- **Comandos Prisma (de apps/api):** `npx prisma validate` · `npx prisma migrate dev --name <nome>` · `npx prisma generate` · `npx prisma migrate deploy`
- **Ver o banco local:** `docker compose exec db psql -U vetunif -d vetunif -c "<sql>"`
- **Commits:** ticket 01 de `d3dc6fe` a `d861fdb` · ticket 02 `485a806` e `508054a` · ticket 03 de `c5f489f` a `f086b38` (7 commits)

## Decisões Tomadas
- **Ordem de montagem**: monorepo → Postgres → api → shared → web → compose; cada camada é testada antes da próxima.
- **Entidades entram no seu ticket**: `tutor` e `animal` só têm PK; as colunas vêm no 04/05 e a relação no 05.
- **PK `Int @default(autoincrement())`**: a permissão é checada no back, então um id adivinhável não dá acesso. Candidato a ADR 0005.
- **Tabelas, colunas e enums em minúsculas via `@@map`/`@map`**: evita aspas no SQL; no TS os campos continuam em camelCase.
- **`@unique` no `nomeUsuario` no banco**: só o banco garante unicidade com dois cadastros ao mesmo tempo.
- **`crmv` opcional no banco**: a regra "obrigatório para VETERINARIO" depende do perfil e fica na validação (ticket 07).
- **`bcryptjs`, e não `bcrypt` ou `argon2`**: JS puro, sem compilação nativa na `node:24-slim`; o salt vai dentro do hash.
- **Seed em `src/` e rodando no `CMD`**: o `tsc` compila para `dist/seed.js`; o Render Free não tem shell nem pre-deploy. O `upsert` com `update: {}` torna o seed idempotente e não reseta a senha.
- **`ADMIN_SENHA` vem do ambiente**: o repositório é público. Falha cedo se tiver menos de 8 caracteres.
- **`JWT_SECRET` com falha cedo**, como a `DATABASE_URL`; `expiresIn: '8h'` no registro do plugin, e não em cada `sign`.
- **A mesma mensagem para usuário inexistente e senha errada**: não deixa descobrir quais usuários existem.
- **O teste de `ativo` vem depois da senha, com 403**: a mensagem "inativo" só aparece para quem acertou a senha; a identidade foi confirmada, e o problema é a permissão.
- **`UsuarioSessao` montado campo a campo** no login e na `/api/sessao`: o `senhaHash` não vai para o token, e `iat`/`exp` não vão na resposta.
- **No login, `loginSchema` só checa "não vazio"**: o formato (3 a 30 caracteres, `a-z0-9.`, senha ≥ 8) é validado na criação do usuário.
- **Rotas protegidas por padrão (hook global + lista de públicas)**: uma rota nova já nasce protegida. Uma rota `/api` inexistente responde 401 sem token.
- **`exigirPerfil` como factory no `preHandler`**: roda depois do `onRequest`, quando o `request.user` já existe.
- **Rotas em plugin por recurso (`src/rotas/`)**: o `server.ts` não cresce a cada ticket.
- **Erros só pelo handler central**: a rota lança `ErroHttp`; o handler loga o erro original e responde `{ mensagem }`; o `unknown` é estreitado com `instanceof`/`in`/`typeof`.
- **503 para o banco fora**: dependência indisponível não é erro do cliente.
- **O web valida toda resposta com Zod** pela `api()`, que recebe o schema; `Validador<T>` evita o web depender do `zod` direto.
- **Um único `api()` trata o 401** (limpa a sessão e faz `router.replace` para o login), exceto em `/api/login`, onde o 401 é senha errada.
- **Só o token no localStorage**: o `usuario` é recarregado na `/api/sessao` pelo guard após o F5.
- **Sessão em `ref` de módulo, sem Pinia**: dois valores não justificam uma store.
- **Telas protegidas por padrão no router (`meta.publica` nas exceções)**; quem está logado e abre `/login` vai para a Recepção.
- **O menu e o guard leem a mesma lista `telas`** (`meta.titulo`, `meta.perfis`) e a mesma `podeAcessar`. O guard bloqueia a URL digitada; a barreira real é o 403 da API.
- **Layout como rota pai com filhas de caminho absoluto**: o layout monta uma vez; o `RouterLink` usa `tela.path`; `exact-active-class` porque `/` é prefixo de tudo.
- **Um `<aside>` para desktop e celular**: `fixed` + `-translate-x-full` no celular, `md:static` no desktop; o `watch` na rota fecha o menu.
- **Telas vazias agora para Tutores, Animais e Usuários** (escolha do usuário): o menu fica completo e testável; cada ticket preenche a sua tela.
- **Valores padrão de `JWT_SECRET` e `ADMIN_SENHA` só no compose**: o compose é local; em produção vale a falha cedo.
- **`ADMIN_SENHA` no Render antes do push**: sem ela o seed falha, o health check não passa e o Render mantém a versão anterior.
- **Mesma origem em dev e prod**: proxy `/api` no Vite; em prod, o Fastify serve o Vue (ADR 0004). Sem CORS.
- **Static só se `existsSync(WEB_DIST)`, caminho via `import.meta.url`, fallback para `index.html` só em GET fora de `/api`**: a api roda sem o build do web; o Vue Router em modo history resolve no cliente.
- **`Dockerfile.dev` e `Dockerfile` multi-stage separados**: o runtime de prod começa limpo com `npm ci --omit=dev` e copia só os `dist` (~795 MB).
- **`prisma` e `dotenv` em `dependencies`**: a migration roda na inicialização. O alerta do `effect` no `npm audit --omit=dev` foi aceito: a CLI só roda o `migrate deploy`, sem entrada externa.
- **`migrate deploy && seed && start`**: se uma etapa falhar, o servidor não sobe; as duas primeiras são idempotentes.
- **Neon e Render em Ohio, URL direta do Neon**: latência api↔banco de 1–2 ms; o PgBouncer em modo transaction atrapalha os locks do `migrate deploy`.
- **tsx no dev, tsc/vue-tsc no build**: o dev não checa tipos; o build roda antes de commitar e antes do `docker build`.
- **ES Modules** (`"type": "module"` + `nodenext`): imports relativos com `.js` na api; `await` no topo é permitido.
- **Variáveis vêm do ambiente**: `--env-file-if-exists` no dev (no container não há `.env`); `environment` no compose; painel no Render.
- **TypeScript 6 no web e 7 na api/shared**: o `vue-tsc` ainda depende do 6. **npm em vez de pnpm.**

## Pendências / Em Aberto
- **Status do ticket 03**: o usuário vai marcá-lo no arquivo do ticket (hoje está `ready-for-agent`).
- **`.env.example` da raiz**: ainda não tem `JWT_SECRET=` e `ADMIN_SENHA=` (o compose funciona pelos valores padrão).
- **PDF**:
  - avisar que o Render Free hiberna (~50 s na primeira visita);
  - registrar a avaliação da vulnerabilidade do `effect`;
  - registrar que o token emitido antes de uma inativação vale por até 8 h (o JWT não guarda estado);
  - incluir as credenciais de demonstração (ticket 11).
- **Ticket 07**: usar `exigirPerfil('ADMIN')` nas rotas de usuário e reusar `NOME_PERFIL`; validar o formato do nome de usuário, a senha ≥ 8 e o CRMV para VETERINARIO.
- **Ticket 11**: o seed passa a criar um usuário de cada perfil (`admin`, `atendente`, `veterinario`), mais tutores, animais e histórico.
- **Opcionais**:
  - ADR 0005 da PK `Int`;
  - atualizar a pendência "versão do Node" em `docs/especificacao.md` (Node 24 LTS);
  - reduzir a imagem (o `npm ci --omit=dev` instala o `vue`, que não é usado no runtime);
  - na `api()`, recusar um caminho que não começa com `/`.
- **Decidir se `.claude/docs/` fica no git**, dado o que o README declara sobre IA (hoje o arquivo está versionado).

## Armadilhas Conhecidas
- **`-D` vale para o comando inteiro**; **flag com erro de digitação é ignorada só com um aviso** (`--saved-prod`). Confira o `package.json` depois de cada install; `npm install --save-prod <pkg>` move para dependencies.
- **A tag `latest` do `prisma` é `8.0.0-rc`**: use `prisma@7` e `@prisma/client@7`. A fonte da verdade é `npx prisma --help`, não docs de outra versão.
- **O `prisma init` gera extras** (skills de IA, `.env` `prisma+postgres://`): olhe o `git status` depois de qualquer gerador.
- **O Prisma 7 não lê o `.env` sozinho**, e o `migrate dev` não roda o `generate`.
- **`` `${process.env.X}` `` transforma `undefined` em `"undefined"`**; variáveis de ambiente são `string | undefined`: `Number(x ?? padrão)`.
- **Sem `include`, o `tsc` compila tudo da pasta**; `tsc arquivo.ts` ignora o tsconfig; `tsc` só compila, `tsx` executa.
- **Interpolação `${}` só com crase**; barra invertida em script do package.json quebra o JSON.
- **`localhost` dentro de um container é o próprio container**: use o nome do serviço (`db:5432`, `api:3000`) ou `host.docker.internal`. O servidor em container precisa ouvir em `0.0.0.0`.
- **`POSTGRES_*` só vale na primeira inicialização do volume**; `$${VAR}` no compose deixa a variável para o shell do container.
- **`git add .` só pega a pasta atual**: use `git add -A` da raiz. **Nunca editar `src/generated/`.**
- **Erros de digitação que falham em silêncio**: `felx` (Tailwind), `nodde_modules` (`.dockerignore`), `<script setur>` (o Vue trata como `<script>` comum; o template não enxerga nada e o botão não faz nada). Quando tudo do script aparece como inexistente no `vue-tsc`, o problema é a tag.
- **`catch` genérico engole qualquer erro** (`saudeSchemaparse`): faça log no `catch` e rode o build.
- **O parser aponta onde percebeu o erro, não onde ele está**: `import fastifyStaticfrom` → `TS1005`; `name 'login'` sem `:` → "`,` or `}` expected". Olhe o token anterior.
- **Import de tipo sem `type` quebra só no `tsx`** (`does not provide an export named 'RespostaLogin'`): o que vem de `z.infer` é importado com `type`; o `*Schema`, sem. O `verbatimModuleSyntax` do build acusa (`TS1484`).
- **Editar o `src/` do shared não muda nada até o `npm run build -w @clinica/shared`**: os consumidores leem o `dist` (`does not provide an export named 'loginSchema'`).
- **No Fastify, uma rota guarda o error handler e os hooks que existiam quando foi registrada**: `await register(plugin)` antes do `setErrorHandler` deu o corpo padrão `{statusCode,error,message}`. Configure handlers e hooks antes dos `register`.
- **O `Promise<T>` da rota não remove campos**: `return request.user` mandou `iat` e `exp`.
- **Container esquecido na mesma porta**: o `docker run` do ticket 02 (`boring_engelbart`) ficou 5 h na 3000, e a rota nova deu 404. No Windows os dois fazem bind sem `EADDRINUSE`. Diagnóstico: `netstat -ano | findstr :3000` e `docker ps`; use `--name` e pare o container.
- **`fetch` sem `/` inicial é relativo à página**: `'api/sessao'` funciona em `/` e vira `/tutores/api/sessao` em `/tutores` (o fallback devolve HTML com 200).
- **O perfil fica dentro do token**: depois de mudar o perfil no banco, saia e entre de novo para testar.
- **`erasableSyntaxOnly` no web**: sem *parameter properties* (`constructor(public status...)`); declare o campo.
- **Erro de compilação descoberto no `docker build` custa ~30 s**; o build local custa ~2 s.
- **O nome do Dockerfile de produção é `Dockerfile`**; outros nomes exigem `-f`/`dockerfile:`.
- **Região do Neon não muda depois de criado**; projeto excluído invalida a URL e a senha.
- **Não criar `PORT` no Render**; **a URL do Neon e a `ADMIN_SENHA` de produção ficam só no painel do Render**, nunca no chat, no commit ou em `.env` versionado.
- **No `create-vite`, o `@types/node` vem na versão mais nova**: alinhe com `@24`.
- **O error handler do Fastify recebe `unknown`**: estreite antes de ler `statusCode`.
- **`rm -rf` de caminho errado não dá erro.**

## Ultima Atualizacao
2026-11-26 — Ticket 03 concluído e publicado: entidade `Usuario`, seed do admin no `CMD`, login JWT de 8h, hook global 401 + `exigirPerfil` 403, sessão/guardas/`api()` no web, layout com menu por perfil; armadilhas de import de tipo, build do shared, ordem no Fastify, porta ocupada e `fetch` relativo.
