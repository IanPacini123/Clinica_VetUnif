# 02: Esqueleto publicado

**What to build:** o mesmo caminho do ticket 01 (página do Vue → rota de saúde → banco) funcionando numa URL pública. Um único container no Render serve o build do Vue e a API na mesma origem; o banco é o Postgres do Neon. A cada push na branch principal, o deploy acontece sozinho. Ver ADR 0004.

**Blocked by:** 01 (Esqueleto local ponta a ponta)

**Status:** done

- [x] Repositório público no GitHub com o código do ticket 01
- [x] Dockerfile multi-stage que compila shared, web e api e gera uma imagem que serve front e API
- [x] Fastify serve os arquivos do Vue e devolve `index.html` para rotas que não são da API (Vue Router em modo history)
- [x] Banco no Neon com as migrations aplicadas no deploy
- [x] Segredos (URL do banco, segredo do JWT) configurados como variáveis de ambiente no Render, nunca no repositório
- [x] Acessando a URL pública, a página mostra "API ok / banco ok"
- [x] Push na branch principal dispara novo deploy automaticamente
