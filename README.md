# Clínica Veterinária de Bairro

Plataforma web para uma clínica veterinária pequena: cadastro de Tutores e Animais, recepção dos animais que chegam e registro dos atendimentos feitos pelos veterinários.

Projeto da disciplina **N695 — Desenvolvimento de Plataformas Web** (Universidade de Fortaleza), cenário 1: *Clínica Veterinária de Bairro*.

## Aplicação publicada

**https://clinica-vetunif.onrender.com/**

> **A primeira visita pode demorar cerca de 50 segundos.** A aplicação está no plano gratuito do Render, que hiberna o serviço depois de um tempo sem acesso. Na primeira requisição, o serviço volta a subir; depois disso, as páginas abrem normalmente.

### Credenciais de demonstração

| Perfil | Usuário | Senha |
|---|---|---|
| ATENDENTE | `atendente` | `demo1234` |
| VETERINARIO | `veterinario` | `demo1234` |
| ADMIN | `admin` | informada no PDF de entrega |

A aplicação publicada já tem dados de exemplo:

- 3 Tutores e 5 Animais (cachorro, gato, ave e roedor).
- Uma Fila com 3 Pacientes aguardando, um deles com Prioridade.
- Animais com Histórico: Atendimentos finalizados (com peso, diagnóstico e conduta) e cancelados.

## Funcionalidades

- **Login com perfis**: ADMIN, ATENDENTE e VETERINARIO, cada um com suas permissões.
- **CRUD de Tutor e Animal**: um Tutor tem vários Animais; busca, paginação e validações (CPF, e-mail, datas).
- **Exclusão lógica**: "excluir" inativa o registro; só o ADMIN vê e reativa inativos (detalhes abaixo).
- **Recepção e Fila**: a ATENDENTE registra a Chegada de um Animal, com Prioridade opcional; a Fila mostra os prioritários primeiro e se atualiza a cada 10 segundos.
- **Atendimento**: o VETERINARIO escolhe um Paciente da Fila, registra peso, anamnese, diagnóstico e conduta, e finaliza ou devolve o Paciente à Fila.
- **Histórico**: todos os Atendimentos de cada Animal, acessível também durante um atendimento.
- **Gestão de Usuários**: o ADMIN cadastra, edita, troca a senha, inativa e reativa os Usuários da clínica.

### "Excluir" é inativar

Nenhum Tutor, Animal ou Usuário é apagado do banco ([ADR 0001](docs/adr/0001-exclusao-logica.md)). O botão "Inativar" marca o registro como inativo:

- O registro some das listas, das buscas e dos seletores para ATENDENTE e VETERINARIO.
- O ADMIN vê os inativos com o filtro "Mostrar inativos" e pode reativá-los.
- Um Tutor só é inativado depois dos seus Animais, e um Animal com Atendimento em aberto não é inativado.
- Um Usuário inativo não consegue entrar.
- Atendimentos nunca são apagados: um Atendimento que não vai acontecer é **cancelado** e fica no Histórico.

## Stack

| Camada | Tecnologias |
|---|---|
| Front-end | Vue 3, Vue Router, Vite, Tailwind CSS, TypeScript |
| Back-end | Node.js 24, Fastify 5, Prisma 7, TypeScript |
| Banco de dados | PostgreSQL 17 |
| Autenticação | JWT (`@fastify/jwt`, validade de 8 h) e senhas com bcrypt |
| Validação | Zod (schemas compartilhados entre front e back) |
| Infraestrutura | Docker / Docker Compose, monorepo com npm workspaces |
| Publicação | Render (aplicação) + Neon (PostgreSQL) |

Em produção, um único container roda o Fastify, que responde a API em `/api` e serve o build do Vue ([ADR 0004](docs/adr/0004-deploy-em-container-unico.md)). A cada deploy, o container aplica as migrations, roda o seed e sobe o servidor.

## Estrutura

```
apps/web         Front-end Vue
apps/api         API Fastify, schema Prisma, migrations e seed
packages/shared  Schemas de validação, tipos e enums do domínio
docs/            Especificação e ADRs
.scratch/        Tickets de implementação
```

## Como rodar localmente

Requisito: [Docker](https://www.docker.com/) com Docker Compose.

```
git clone https://github.com/IanPacini123/Clinica_VetUnif.git
cd Clinica_VetUnif
docker compose up --build
```

- Aplicação: http://localhost:5173
- API: http://localhost:3000 (saúde em `/api/health`)

Na primeira subida, a API aplica as migrations e roda o seed, que cria os mesmos Usuários e dados de exemplo da aplicação publicada. Localmente, a senha do `admin` é `admin12345`; `atendente` e `veterinario` usam `demo1234`.

O Compose funciona sem arquivo `.env`. Para mudar o banco ou a porta do Postgres (padrão `5432`), copie o `.env.example` para `.env` e ajuste os valores.

Para apagar os dados locais e começar do zero: `docker compose down -v`.

## Documentação

- [CONTEXT.md](CONTEXT.md): glossário do domínio (Tutor, Animal, Atendimento, Fila etc.)
- [docs/especificacao.md](docs/especificacao.md): regras de negócio, permissões, fluxos e decisões
- [docs/adr/](docs/adr/): registros das decisões de arquitetura
  - [0001 — Exclusão lógica](docs/adr/0001-exclusao-logica.md)
  - [0002 — Domínio em português](docs/adr/0002-dominio-em-portugues.md)
  - [0003 — Monorepo com pacote compartilhado](docs/adr/0003-monorepo-com-pacote-compartilhado.md)
  - [0004 — Deploy em container único](docs/adr/0004-deploy-em-container-unico.md)
- [.scratch/clinica-veterinaria/issues/](.scratch/clinica-veterinaria/issues/): tickets de implementação, em ordem de dependência

## Declaração de uso de IA

Foi utilizado o **Claude Code** (Anthropic) como assistente no **planejamento** do projeto. Até o momento, **nenhum código da aplicação foi implementado com IA**. O uso se limitou a:

- Discussão da proposta do trabalho e escolha de stack e infraestrutura.
- Entrevista estruturada para definir entidades, regras de negócio, permissões e fluxos.
- Redação do glossário (`CONTEXT.md`), dos ADRs e da especificação (`docs/especificacao.md`).
- Divisão do trabalho em tickets de implementação (`.scratch/`).
- Arquivos de configuração do repositório (`.gitignore` e `.gitattributes`) e este README.

As decisões de produto e de arquitetura foram tomadas pelo autor; a IA propôs opções e registrou as decisões. Esta seção será atualizada conforme o projeto avançar.

## Autor

Ian Pacini
