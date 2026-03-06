# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./
RUN npm install

COPY src ./src
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

RUN npm install -g pm2

COPY package*.json ./
COPY ecosystem.config.js ./
RUN npm install --only=production

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["pm2-runtime", "start", "ecosystem.config.js"]
