# Simple production Dockerfile
FROM node:20-alpine

WORKDIR /app

# Install dependencies first (use package*.json if lockfile exists)
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev || npm install --omit=dev

# Copy source
COPY . .

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["node", "server.js"]
