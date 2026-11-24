# Clínica Veterinária de Bairro

Plataforma web para uma clínica veterinária pequena: cadastro de Tutores e Animais, recepção dos animais que chegam e registro dos atendimentos feitos pelos veterinários.

Projeto da disciplina **N695 — Desenvolvimento de Plataformas Web** (Universidade de Fortaleza), cenário 1: *Clínica Veterinária de Bairro*.

> **Status:** em desenvolvimento. Até o momento o repositório contém apenas o planejamento do projeto (documentação e tickets); a implementação ainda não começou.

## Funcionalidades planejadas

- **Login com perfis**: ADMIN, ATENDENTE e VETERINARIO, cada um com suas permissões.
- **CRUD de Tutor e Animal**: um Tutor tem vários Animais; busca, paginação e validações (CPF, e-mail, datas).
- **Exclusão lógica**: "excluir" inativa o registro; só o ADMIN vê e reativa inativos.
- **Recepção e Fila**: a ATENDENTE registra a Chegada de um Animal, com Prioridade opcional; a Fila mostra os prioritários primeiro.
- **Atendimento**: o VETERINARIO escolhe um Paciente da Fila, preenche o atendimento e finaliza.
- **Histórico**: todos os Atendimentos de cada Animal, acessível também durante um atendimento.
- **Gestão de Usuários**: o ADMIN cadastra e gerencia os Usuários da clínica.

## Stack

| Camada | Tecnologias |
|---|---|
| Front-end | Vue 3, Vite, Tailwind CSS, TypeScript |
| Back-end | Node.js, Fastify, Prisma, TypeScript |
| Banco de dados | PostgreSQL |
| Validação | Zod (schemas compartilhados entre front e back) |
| Infraestrutura | Docker / Docker Compose, monorepo com npm workspaces |
| Publicação | Render (aplicação) + Neon (PostgreSQL) |

## Estrutura planejada

```
apps/web         Front-end Vue
apps/api         API Fastify
packages/shared  Schemas de validação, tipos e enums do domínio
docs/            Especificação e ADRs
.scratch/        Tickets de implementação
```

## Documentação

- [CONTEXT.md](CONTEXT.md): glossário do domínio (Tutor, Animal, Atendimento, Fila etc.)
- [docs/especificacao.md](docs/especificacao.md): regras de negócio, permissões, fluxos e decisões
- [docs/adr/](docs/adr/): registros das decisões de arquitetura
  - [0001 — Exclusão lógica](docs/adr/0001-exclusao-logica.md)
  - [0002 — Domínio em português](docs/adr/0002-dominio-em-portugues.md)
  - [0003 — Monorepo com pacote compartilhado](docs/adr/0003-monorepo-com-pacote-compartilhado.md)
  - [0004 — Deploy em container único](docs/adr/0004-deploy-em-container-unico.md)
- [.scratch/clinica-veterinaria/issues/](.scratch/clinica-veterinaria/issues/): tickets de implementação, em ordem de dependência

## Como rodar

_Será documentado quando a implementação começar._

## Aplicação publicada

_Link será adicionado após o primeiro deploy._

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
