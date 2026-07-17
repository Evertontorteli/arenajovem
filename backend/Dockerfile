FROM node:22-alpine AS base

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src

ENV NODE_ENV=production
EXPOSE 3333

CMD ["node", "src/server.js"]
