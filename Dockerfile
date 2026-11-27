# ---------- estágio 1: build ----------
FROM node:24-slim AS build
WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
RUN npm ci

COPY . .
RUN npm run build -w @clinica/shared \
 && npm exec -w @clinica/api -- prisma generate \
 && npm run build -w @clinica/web \
 && npm run build -w @clinica/api

# ---------- estágio 2: runtime ----------
FROM node:24-slim
WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
RUN npm ci --omit=dev

COPY --from=build /app/packages/shared/dist packages/shared/dist
COPY --from=build /app/apps/api/dist apps/api/dist
COPY --from=build /app/apps/api/prisma apps/api/prisma
COPY --from=build /app/apps/api/prisma7.config.ts apps/api/
COPY --from=build /app/apps/web/dist apps/web/dist

EXPOSE 3000
CMD ["sh", "-c", "npm run db:deploy -w @clinica/api && npm run db:seed -w @clinica/api && npm start -w @clinica/api"]
