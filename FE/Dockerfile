# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build-time API base URLs. Relative paths keep every request on the app's own
# origin, so the nginx below proxies /api/* to the backends: one public port,
# no CORS in the browser path, and no rebuild when the domain changes.
ARG VITE_AUTH_API_URL=/api/auth
ARG VITE_USER_API_URL=/api/user
ARG VITE_OFFICIAL_API_URL=/api/official
ARG VITE_USER_BACKEND_URL=/api/user
ENV VITE_AUTH_API_URL=$VITE_AUTH_API_URL \
    VITE_USER_API_URL=$VITE_USER_API_URL \
    VITE_OFFICIAL_API_URL=$VITE_OFFICIAL_API_URL \
    VITE_USER_BACKEND_URL=$VITE_USER_BACKEND_URL

# Build the application
RUN npm run build

# Stage 2: Production with Nginx
FROM nginx:alpine

# Install Node.js for serving (optional, if you need SSR)
# For static files, just nginx is enough
WORKDIR /usr/share/nginx/html

# Remove default nginx static files
RUN rm -rf ./*

# Copy built files from builder
COPY --from=builder /app/dist .

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
