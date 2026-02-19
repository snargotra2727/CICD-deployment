FROM node:20-alpine

WORKDIR /app

# Install nodemon for hot-reload
RUN npm install -g nodemon ts-node

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY src ./src

EXPOSE 3000

CMD ["nodemon", "--exec", "ts-node", "src/server.ts"]
