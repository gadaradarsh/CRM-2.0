# Stage 1: Build the React application
FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies first (leverage Docker cache)
COPY package.json package-lock.json ./
RUN npm install

# Copy the rest of the source code and build
COPY . .
RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginxinc/nginx-unprivileged:alpine

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the built React app from the build stage (adjust ownership)
COPY --chown=nginx:nginx --from=build /app/build /usr/share/nginx/html

# Expose port 8080 (unprivileged)
EXPOSE 8080

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
