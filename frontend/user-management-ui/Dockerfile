FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json angular.json tsconfig*.json ./
RUN npm ci
COPY src ./src
COPY public ./public
RUN npm run build -- --configuration production
FROM nginx:alpine
COPY --from=builder /app/dist/user-management-ui/browser /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
