# syntax=docker/dockerfile:1

# Stage 1: Build
FROM node:24-alpine AS builder

WORKDIR /app

# Copy dependency specifications
COPY package.json package-lock.json ./
RUN npm ci

# Copy project files
COPY . .

# Build Next.js static export into out/
RUN npm run build

# Stage 2: Production Server
FROM nginx:alpine AS runner

# Clean default nginx files
RUN rm -rf /usr/share/nginx/html/*

# Copy exported site
COPY --from=builder /app/out /usr/share/nginx/html

# Copy custom nginx configuration
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
