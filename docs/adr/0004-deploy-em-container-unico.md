# Deploy em container único no Render, banco no Neon

Em produção, o Fastify serve o build do Vue como arquivos estáticos e a API no mesmo container, publicado no Render; o PostgreSQL fica no Neon. Escolhemos isso para ter um único link, front e API na mesma origem (sem CORS nem URL de API configurável) e um único Dockerfile. Localmente, o `docker compose` mantém web, api e banco como serviços separados na mesma rede.

## Considered Options

- Front no GitHub Pages ou Render Static Site + API separada: dois links e configuração de CORS.
- Postgres gratuito do Render: expira em 30 dias, no limite do prazo de 10/12.

## Consequences

- No plano gratuito o Render hiberna o serviço: a primeira visita após inatividade leva cerca de 50s.
- O Vue Router usa modo history, com o Fastify devolvendo `index.html` para rotas que não são da API.
