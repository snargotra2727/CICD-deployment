# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install Angular CLI
RUN npm install -g @angular/cli

# Disable Angular analytics
RUN ng analytics disable --global

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all source files
COPY . .

# Build the app
RUN npm run build:prod

# Production stage
FROM nginx:alpine

# Copy built files - CORRECT PATH based on your build output
COPY --from=builder /app/dist/user-management-ui /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
