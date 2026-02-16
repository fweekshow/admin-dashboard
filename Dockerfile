# Use Node 22.12 which is compatible with Prisma
FROM node:22.12-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Standalone output needs static/public assets copied alongside server.js
RUN mkdir -p /app/.next/standalone/.next && \
    cp -r /app/.next/static /app/.next/standalone/.next/static && \
    if [ -d /app/public ]; then cp -r /app/public /app/.next/standalone/public; fi

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    chown -R nextjs:nodejs /app/.next

USER nextjs

# Railway will route to whatever port the app listens on
# Next.js standalone automatically reads PORT from environment
EXPOSE 8080

ENV HOSTNAME="0.0.0.0"
ENV NODE_ENV=production

# Next.js standalone server.js reads PORT from Railway's environment automatically
CMD ["sh", "-c", "cd /app/.next/standalone && node server.js"]
