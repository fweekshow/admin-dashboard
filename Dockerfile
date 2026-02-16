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

# Railway sets PORT dynamically - expose a range
EXPOSE 3000

ENV NODE_ENV=production

# Next.js standalone reads PORT from Railway automatically
# Railway will inject PORT env var at runtime
CMD ["node", ".next/standalone/server.js"]
