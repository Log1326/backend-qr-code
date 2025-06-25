# Этап 1: сборка
FROM node:18 AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY tsconfig.json ./
COPY prisma ./prisma/
COPY src ./src/
# Генерация клиента Prisma
RUN npx prisma generate

# Сборка проекта
RUN npm run build

# Этап 2: запуск
FROM node:18-slim

WORKDIR /app

# Устанавливаем OpenSSL для поддержки Prisma
RUN apt-get update && apt-get install -y openssl

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma

ENV NODE_ENV=production
ENV PORT=3000

CMD ["node", "dist/src/main.js"]
