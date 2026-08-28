# Fertilizer Management System - backend (Express + Mongoose)
FROM node:20-alpine

WORKDIR /app

# Install production dependencies only, using the lockfile
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Application source
COPY . .

# Version is injected at build time and exposed via /api/health
ARG APP_VERSION=0.0.0
ENV APP_VERSION=$APP_VERSION
ENV NODE_ENV=production

EXPOSE 5000

# Run pending DB migrations, then start the real production server.
# If migrations fail the container exits non-zero and the API never starts.
CMD ["sh", "-c", "node migrate.js && node server.js"]
