# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build all applications
RUN npm run build

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

# Install curl for healthchecks
RUN apk add --no-cache curl

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install production dependencies only
RUN npm ci --only=production

# Copy Prisma generated client
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Copy built applications
COPY --from=builder /app/dist ./dist

# Copy geojson data if exists
COPY --from=builder /app/geojsonData ./geojsonData

# Expose ports for all services
EXPOSE 3000 8080 8081

# Default command (will be overridden by docker-compose)
CMD ["node", "dist/apps/common/main.js"]
