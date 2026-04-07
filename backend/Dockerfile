# Use the official Python lightweight image for version 3.12 (Django 6 requires python 3.12+)
FROM python:3.12-slim

# Set environment variables so Python behaves well in Docker
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install system dependencies (dos2unix prevents Windows line-ending errors, netcat is used to check DB status)
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    dos2unix \
    netcat-openbsd \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory inside the container
WORKDIR /app

# Copy the requirements file and install dependencies
COPY requirements.txt /app/
RUN pip install --upgrade pip && pip install -r requirements.txt

# Copy the rest of your Django project into the container
COPY . /app/

# Convert Windows CRLF line endings to Linux LF, and make the script executable
RUN dos2unix /app/entrypoint.sh && chmod +x /app/entrypoint.sh

# Tell Docker what command to run every time it starts
ENTRYPOINT ["/app/entrypoint.sh"]
