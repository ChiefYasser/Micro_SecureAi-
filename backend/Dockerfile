# Pinned to Bookworm (Debian 12) for a hardened, well-patched base
FROM python:3.12-slim-bookworm

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install system dependencies and apply all security patches
RUN apt-get update && apt-get upgrade -y && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    dos2unix \
    netcat-openbsd \
    && rm -rf /var/lib/apt/lists/*

# Upgrade pip and bundled packages to patch known CVEs
RUN pip install --no-cache-dir --upgrade pip setuptools wheel

WORKDIR /app

COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

COPY . /app/

RUN dos2unix /app/entrypoint.sh && chmod +x /app/entrypoint.sh

ENTRYPOINT ["/app/entrypoint.sh"]
