# Stage 1: Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Runtime stage
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist_prod ./dist_prod
COPY --from=builder /app/public ./public
RUN mkdir -p public/uploads
EXPOSE 3000
CMD ["npm", "start"]
