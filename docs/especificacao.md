# Especificação — Clínica Veterinária de Bairro (N695)

## Resumo
Trabalho da disciplina N695 (Desenvolvimento de Plataformas Web, Unifor): plataforma web completa para o cenário "Clínica Veterinária de Bairro". Front Vue + API Fastify + PostgreSQL, publicados na nuvem. Este documento reúne stack, regras de negócio, permissões, fluxos e decisões. Glossário em `CONTEXT.md`; decisões de arquitetura em `docs/adr/`.

## Fatos Críticos (verbatim, nunca parafrasear)
- **Entidades exigidas pelo enunciado (CRUD completo):** `Tutor` e `Animal`
- **Entidades do sistema:** `Usuario`, `Tutor`, `Animal`, `Atendimento`
- **Perfis:** `ADMIN`, `ATENDENTE`, `VETERINARIO`
- **Status do Atendimento:** `AGUARDANDO`, `EM_ATENDIMENTO`, `FINALIZADO`, `CANCELADO`
- **Espécies:** `Cachorro`, `Gato`, `Ave`, `Roedor`, `Outro`
- **Sexo do Animal:** `Macho`, `Fêmea`
- **Estrutura do monorepo:** `apps/web`, `apps/api`, `packages/shared`
- **Formato de erro da API:** `{ mensagem, campos? }`
- **Status HTTP:** `400` validação · `401` não autenticado · `403` sem permissão · `404` não encontrado · `409` regra de negócio/conflito
- **Usuários do seed de demonstração:** `admin`, `atendente`, `veterinario`
- **Prazo de commits:** `27/11` · **Repo e app online até:** `10/12`
- **Critérios (5,0):** completude `1,5` · rigor técnico `2,0` · documentação `1,0` · reflexão `0,5`

## Decisões Tomadas

### Stack e infraestrutura
- **TypeScript em tudo**: tipos compartilhados entre front e back.
- **Vue 3 + Vite + Tailwind no front**: escolha da equipe para aprender; Tailwind facilita a responsividade.
- **Fastify + Prisma + PostgreSQL no back**: Banco de dados garante a nota máxima em rigor técnico; Prisma é mais acessível (migrations e seed prontos).
- **Zod em `packages/shared`**: o mesmo schema valida o formulário e a rota; só validação e tipos, nunca acesso a dados (ADR 0003).
- **npm workspaces**: monorepo simples sem ferramenta extra.
- **Local com `docker compose`** (web, api, postgres em rede): ambiente igual para toda a equipe.
- **Produção: container único no Render (Fastify serve o build do Vue) + Postgres no Neon**: um link, mesma origem, sem CORS (ADR 0004).
- **Vue Router em modo history**: Fastify devolve `index.html` para rotas fora da API.
- **Autenticação JWT Bearer no localStorage, expira em 8h**: mais simples possível; 401 redireciona ao login.
- **Domínio em português, termos técnicos em inglês** (ex.: `atendimentoService.finalizar()`): evita divergência com o glossário (ADR 0002).
- **Testes**: apenas unitários dos services de regra de negócio (Vitest), se sobrar tempo.

### Regras de cadastro
- **Tutor**: nome obrigatório (≥ 3 caracteres); CPF obrigatório, único e com dígitos verificadores válidos; telefone obrigatório; e-mail opcional com formato validado; sem endereço (pouco valor).
- **Animal**: nome obrigatório; espécie da lista fixa; raça opcional; sexo obrigatório; data de nascimento opcional e não futura; Tutor obrigatório e ativo; Tutor pode ser trocado na edição (adoção).
- **Usuário**: login por nome de usuário único, 3 a 30 caracteres, apenas `a-z`, `0-9` e `.`, imutável após criado; senha ≥ 8 caracteres com hash; CRMV obrigatório quando o perfil é `VETERINARIO`; ADMIN não pode inativar a si mesmo; ADMIN edita nome, perfil, CRMV e define nova senha; sem "esqueci minha senha".
- **Admin inicial via seed**: o sistema precisa de um primeiro acesso.

### Exclusão lógica (ADR 0001)
- **Excluir = inativar** Tutor, Animal e Usuário: preserva o Histórico e permite desfazer.
- **Atendimento nunca é excluído**: é prontuário; desistência usa `CANCELADO`.
- **Bloqueios**: não inativar Tutor com Animais ativos; não inativar Animal com Atendimento em aberto; não reativar Animal com Tutor inativo; Usuário inativo não loga.
- **Só ADMIN** vê inativos (filtro "mostrar inativos") e reativa.

### Recepção, Fila e Atendimento
- **Chegada cria Atendimento `AGUARDANDO`**: Fila é só um filtro, sem entidade extra.
- **Queixa opcional, obrigatória com Prioridade**: não trava a recepção.
- **Prioridade e Queixa editáveis enquanto `AGUARDANDO`**: o animal pode piorar na espera.
- **Ordem da Fila**: prioritários no topo (card com cor diferente), depois por Chegada; entre prioritários, por Chegada.
- **Máx. 1 Atendimento em aberto por Animal** e **1 `EM_ATENDIMENTO` por VETERINARIO**: mensagem "Finalize ou devolva o atendimento atual antes de iniciar outro".
- **Veterinário escolhe qualquer paciente da Fila**; disputa pelo mesmo paciente → segundo recebe `409` ("Paciente já está em atendimento com Dr(a). X").
- **Veterinário pode devolver à Fila** o paciente que pegou: evita Atendimento travado.
- **Cancelar**: só Atendimento `AGUARDANDO`, por ATENDENTE ou ADMIN.
- **Formulário do Atendimento**: peso, anamnese/observações, diagnóstico (obrigatório para finalizar), conduta (obrigatória para finalizar).
- **`FINALIZADO` é imutável**: comportamento de prontuário.
- **Fila atualiza por polling (~10s) ou botão**: sem WebSocket.

### Permissões
| Ação | ADMIN | ATENDENTE | VETERINARIO |
|---|---|---|---|
| Gerenciar Usuários | ✅ | ❌ | ❌ |
| Criar e inativar Tutor/Animal | ✅ | ✅ | ❌ |
| Editar Tutor/Animal (formulário completo) | ✅ | ✅ | ✅ |
| Ver Tutor, Animal e Histórico | ✅ | ✅ | ✅ |
| Reativar inativos | ✅ | ❌ | ❌ |
| Registrar Chegada / cancelar | ✅ | ✅ | ❌ |
| Pegar paciente e preencher Atendimento | ❌ | ❌ | ✅ |
- **Permissão validada no back-end**: esconder botão no Vue não basta.

### Telas e UX
- **Recepção é a tela inicial de todos os perfis**; mostra atalho "Continuar atendimento" para o VETERINARIO com Atendimento em andamento.
- **Navegação**: menu lateral no desktop, hambúrguer no celular; itens Recepção, Tutores, Animais (todos) e Usuários (ADMIN); topo com nome, perfil e sair.
- **Chegada com Animal novo**: busca → cadastro de Animal (com seção de busca ou cadastro de Tutor) → volta à Chegada com o Animal selecionado.
- **Detalhe do Tutor** lista os Animais dele e tem botão "Adicionar animal" com Tutor preenchido: deixa o relacionamento 1:N visível.
- **Histórico** no detalhe do Animal (mais recente primeiro: data, status, VETERINARIO, diagnóstico; inclui `CANCELADO`; item abre só leitura) **e acessível na tela de Atendimento** (painel ou aba).
- **Listagens**: busca de Tutor por nome/CPF e de Animal por nome do animal/tutor; paginação de 20 por página na API.
- **Animal é a entidade; "Paciente" é só texto de exibição na Recepção/Fila**: alinha com o enunciado.
- **Seed de demonstração**: 1 usuário por perfil, Tutores, Animais e Histórico de exemplo; credenciais no README e no PDF.

## Pendências / Em Aberto
- Inicializar git e criar o repositório público no GitHub.
- Criar contas e serviços no Render e no Neon; publicar o esqueleto no 1º dia.
- Definir versão do Node e configurar o Dockerfile multi-stage.
- Confirmar com o professor a entrega individual: o enunciado pede grupos de 4 a 6 integrantes.
- PDF de entrega (8 a 20 páginas, Modelo de Entrega): prints, requisições, links, declaração de uso de IA, reflexão.
- Implementar os tickets em `.scratch/clinica-veterinaria/issues/` (01 a 11), sempre começando por um cujas dependências já estão prontas.

## Armadilhas Conhecidas
- **Publicação é obrigatória**: "aplicação publicada e acessível por link na nuvem"; Docker local não substitui.
- **GitHub Pages só serve estáticos**: não hospeda API nem banco.
- **Postgres gratuito do Render expira em 30 dias**: por isso o Neon.
- **Render gratuito hiberna**: primeira visita leva ~50s; avisar no PDF.
- **O CRUD avaliado é o de Tutor e Animal**, incluindo editar e excluir pela tela; os fluxos de Recepção não substituem isso.
- **"Excluir" no CRUD é inativação**: explicar no PDF para o professor não achar que falta o delete.
- **Usar o termo "Animal" no código**, nunca "Paciente" como entidade.

## Ultima Atualizacao
2026-11-23 — Criação com todas as decisões do grill de definição do projeto.
