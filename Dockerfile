FROM node:22-bookworm-slim

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 python3-pip python3-venv \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt backend/requirements.txt
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
RUN pip install --no-cache-dir -r backend/requirements.txt

COPY frontend/package.json frontend/package-lock.json frontend/
WORKDIR /app/frontend
RUN npm install

COPY frontend ./
RUN npm run build

WORKDIR /app
COPY backend ./backend

ENV FRONTEND_DIST=/app/frontend/out
WORKDIR /app/backend

CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
