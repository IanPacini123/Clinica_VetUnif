# Monorepo com npm workspaces e schemas compartilhados

O projeto é um monorepo com npm workspaces: `apps/web` (Vue 3 + Vite + Tailwind), `apps/api` (Fastify + Prisma + PostgreSQL) e `packages/shared` (schemas Zod, tipos e enums do domínio), tudo em TypeScript. O pacote compartilhado existe para que a mesma regra de validação rode no formulário do Vue e na rota do Fastify, sem duplicar código; ele contém só validação e tipos, nunca acesso a dados.
