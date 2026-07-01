#!/usr/bin/env bash
set -euo pipefail

export PATH="/opt/homebrew/opt/postgresql@16/bin:${PATH}"

echo "Запуск PostgreSQL…"
brew services start postgresql@16 >/dev/null 2>&1 || true
sleep 1

if ! psql postgres -tc "SELECT 1 FROM pg_roles WHERE rolname='centurion'" | grep -q 1; then
  echo "Создаю пользователя centurion…"
  createuser -s centurion
fi

psql postgres -c "ALTER USER centurion WITH PASSWORD 'centurion';" >/dev/null

if ! psql postgres -tc "SELECT 1 FROM pg_database WHERE datname='centurion_learning'" | grep -q 1; then
  echo "Создаю базу centurion_learning…"
  createdb -O centurion centurion_learning
fi

echo "Готово. DATABASE_URL из .env.example подходит для локальной разработки."
