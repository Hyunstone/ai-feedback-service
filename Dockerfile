FROM node:20-alpine AS base

FROM base AS builder
WORKDIR /app
COPY package.json ./
COPY package-lock.json ./
RUN npm install

COPY . .
RUN npm run build

FROM base AS runner
WORKDIR /app
RUN npm install --global pm2
COPY --from=builder /app .
RUN npm run generate
EXPOSE 3000
CMD ["pm2-runtime", "start", "ecosystem.config.js", "--env", "production"]