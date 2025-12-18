# Single Docker image for Render:
# - Build React/Vite frontend
# - Install Python backend
# - Run FastAPI on 127.0.0.1:8000
# - Run Nginx on $PORT and proxy /api/* to backend

########## Frontend build ##########
FROM node:20-alpine AS frontend_build
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

########## Backend deps ##########
FROM python:3.11-slim AS backend_build
WORKDIR /app/backend

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./

########## Runtime ##########
FROM python:3.11-slim AS runtime
WORKDIR /app

# Install nginx
RUN apt-get update \
    && apt-get install -y --no-install-recommends nginx ca-certificates \
    && rm -rf /var/lib/apt/lists/*

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Python deps
COPY --from=backend_build /usr/local /usr/local

# Backend app
COPY --from=backend_build /app/backend /app/backend

# Frontend static build -> nginx html root
COPY --from=frontend_build /app/frontend/dist /usr/share/nginx/html

# Nginx config (uses $PORT)
COPY nginx.conf /etc/nginx/nginx.conf

# Render sets PORT. We use it for nginx. FastAPI stays internal on 8000.
ENV PORT=10000

EXPOSE 10000

# Start backend then nginx (nginx in foreground)
CMD sh -c "uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 & nginx -g 'daemon off;'"
