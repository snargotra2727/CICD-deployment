# ---- Build Stage ----
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY angular.json ./
COPY tsconfig*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY src ./src
COPY public ./public

# Build Angular app
RUN npm run build -- --configuration production

# Debug: List what was built (optional)
RUN ls -la /app/dist/user-management-ui/

# ---- Production Stage ----
FROM nginx:alpine

# Copy the built files - CORRECT PATH for your build
COPY --from=builder /app/dist/user-management-ui /usr/share/nginx/html

# Optional: Copy nginx config if you have one
# COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
