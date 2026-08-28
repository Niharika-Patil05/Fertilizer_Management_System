# Fertilizer Management System - frontend (React CRA build served by nginx)

# ---- build stage ----
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# API base URL is a RELATIVE path: nginx in the runtime stage proxies /api -> backend.
# This keeps the image portable across sponsor host ports (no rebuild per install).
ARG REACT_APP_API_URL=/api
ARG REACT_APP_VERSION=0.0.0
ENV REACT_APP_API_URL=$REACT_APP_API_URL
ENV REACT_APP_VERSION=$REACT_APP_VERSION
ENV GENERATE_SOURCEMAP=false

RUN npm run build

# ---- runtime stage ----
FROM nginx:1.27-alpine

COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
