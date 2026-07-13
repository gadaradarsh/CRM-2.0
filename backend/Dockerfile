# ─── Stage 1: Dependencies ────────────────────────────────────────
FROM node:20-alpine AS deps

# Install OS-level build tools needed by some npm packages
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy manifests first — Docker caches this layer unless they change
COPY package.json package-lock.json ./

# Install only production dependencies (faster, smaller image)
RUN npm install --omit=dev

# ─── Stage 2: Production image ────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

# Add a non-root user for security
RUN addgroup -S crm && adduser -S crm -G crm

# Copy installed node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application source
COPY . .

# Fix ownership so the non-root user can run the app
RUN chown -R crm:crm /app

USER crm

# Document the port the app listens on
EXPOSE 5000

# Health check — hits /api/health every 30s
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:5000/api/health || exit 1

# Start the server (node, not nodemon — production-safe)
CMD ["node", "server.js"]
