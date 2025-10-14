# Multi-stage build: builder + slim runtime for production

# --- Builder stage ---
FROM node:18-bullseye-slim AS builder
WORKDIR /app

# Install system deps required for some native modules (kept minimal)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    build-essential \
    python3 \
  && rm -rf /var/lib/apt/lists/*

# Copy package files first to leverage caching
COPY package*.json ./

# Install production dependencies. Use npm ci when package-lock.json exists for deterministic installs,
# otherwise fall back to npm install. This avoids an early failure when npm ci isn't applicable.
RUN if [ -f package-lock.json ]; then \
      npm ci --only=production; \
    else \
      npm install --only=production; \
    fi

# Copy application source
COPY . .

# --- Runtime stage ---
FROM node:18-bullseye-slim
WORKDIR /app

# Create non-root user
RUN useradd --user-group --create-home --shell /usr/sbin/nologin appuser || true

# Set NODE_ENV and default PORT (can be overridden at runtime)
ENV NODE_ENV=production
ENV PORT=3000

# Copy from builder
COPY --from=builder /app /app

# Install curl (used by HEALTHCHECK) and ca-certificates in the runtime image.
# We keep this minimal to avoid unnecessary packages in production image.
RUN apt-get update \
  && apt-get install -y --no-install-recommends curl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Set ownership to non-root user
RUN chown -R appuser:appuser /app
USER appuser

# Expose port
EXPOSE 3000

# Basic healthcheck (adjust path if your health endpoint differs)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:${PORT}/health || exit 1

# Start the app using the production start script
CMD ["npm", "run", "start"]
