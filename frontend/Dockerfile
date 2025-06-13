# Build stage
FROM node:20-alpine AS builder

# Install pnpm globally
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy package files (for pnpm)
COPY package.json pnpm-lock.yaml ./

# Install dependencies using pnpm
RUN pnpm install --frozen-lockfile --prod=false

# Copy source code
COPY . .

# Build the application
RUN pnpm run build

# Production stage
FROM nginx:alpine AS production

# Copy custom nginx config (optional - create one if needed)
# COPY nginx.conf /etc/nginx/nginx.conf

# Copy built files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Add nginx configuration for SPA (Single Page Application)
RUN echo 'server { \
    listen 80; \
    listen [::]:80; \
    server_name localhost; \
    root /usr/share/nginx/html; \
    index index.html; \
    \
    # Handle client-side routing \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    \
    # Security headers \
    add_header X-Frame-Options "SAMEORIGIN" always; \
    add_header X-Content-Type-Options "nosniff" always; \
    add_header X-XSS-Protection "1; mode=block" always; \
    \
    # Cache static assets \
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ { \
        expires 1y; \
        add_header Cache-Control "public, immutable"; \
    } \
    \
    # Don'\''t cache HTML files \
    location ~* \.html$ { \
        add_header Cache-Control "no-cache, no-store, must-revalidate"; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"] 