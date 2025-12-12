# Etapa 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

# Instalar pnpm globalmente
RUN npm install -g pnpm@latest && \
    npm cache clean --force

# Copiar archivos de dependencias y lock
COPY pnpm-lock.yaml package.json ./
COPY tsconfig.json nest-cli.json ./
COPY prisma ./prisma/
COPY src ./src

# Instalar todas las dependencias
RUN pnpm install --frozen-lockfile

# Generar cliente de Prisma
RUN pnpm exec prisma generate

# Compilar la aplicación
RUN pnpm run build

# Etapa 2: Runtime
FROM node:22-alpine

WORKDIR /app

# Instalar pnpm globalmente y herramientas de seguridad
RUN npm install -g pnpm@latest && \
    npm cache clean --force && \
    apk add --no-cache dumb-init curl

# Crear usuario no-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    mkdir -p /app && \
    chown -R nodejs:nodejs /app

# Copiar package y prisma schema
COPY --chown=nodejs:nodejs pnpm-lock.yaml package.json ./
COPY --chown=nodejs:nodejs prisma ./prisma/

# Instalar solo dependencias de producción
RUN pnpm install && \
    pnpm exec prisma generate && \
    pnpm store prune

# Copiar código compilado
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist

# Cambiar a usuario no-root
USER nodejs

# Variables de entorno
ENV NODE_ENV=production \
    NODE_OPTIONS="--max-old-space-size=512"

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main"]

LABEL maintainer="juanloaiza21" \
      version="1.0" \
      description="Users Microservice - Secure NestJS Application with pnpm"
