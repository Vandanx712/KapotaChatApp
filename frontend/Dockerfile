# STAGE 1: Build the React + Vite Application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install ALL dependencies (including Vite & Tailwind devDependencies)
RUN npm ci

# Copy frontend source code
COPY . .

# Compile JSX/TSX and CSS into the optimized /app/dist directory
RUN npm run build

# STAGE 2: Lightweight Production Web Server (Nginx) 
FROM nginx:alpine

# Copy custom Nginx SPA configuration from Step 4 
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy ONLY the compiled static files from Stage 1 into Nginx web root
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose standard HTTP port 
EXPOSE 80

# Keep Nginx running in foreground
CMD ["nginx", "-g", "daemon off;"]