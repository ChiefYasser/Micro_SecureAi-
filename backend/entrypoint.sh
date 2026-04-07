#!/bin/bash

# Exit immediately if any command fails
set -e

echo "Waiting for PostgreSQL database to be ready..."
# Keep pinging the postgres container on port 5432 until it responds
while ! nc -z postgres 5432; do
  sleep 1
done
echo "PostgreSQL is online and ready!"

echo "Making and applying Django database migrations..."
# This ensures any new models are synced with the database on startup
python manage.py makemigrations
python manage.py migrate

echo "Starting the SecureAI Django Backend..."
# Run the development server tied to 0.0.0.0 so Docker can expose it to your host machine
exec python manage.py runserver 0.0.0.0:8000
