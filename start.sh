#!/usr/bin/env bash
set -euo pipefail
project_dir="$(cd "$(dirname "$0")" && pwd)"; cd "$project_dir"
[[ -f .env ]] || { echo "Missing .env; copy .env.example and configure it." >&2; exit 1; }
[[ -d server/node_modules && -d client/node_modules ]] || { echo "Dependencies missing; run scripts/bootstrap.sh." >&2; exit 1; }
set -a; . ./.env; set +a
server_port="${SERVER_PORT:-${BACKEND_PORT:-${PORT:-3001}}}"
client_port="${CLIENT_PORT:-${FRONTEND_PORT:-3000}}"
for port in "$server_port" "$client_port"; do
  ! lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1 || { echo "Port $port is already in use." >&2; exit 1; }
done
if [[ "${MIGRATE_ON_START:-false}" == "true" ]]; then
  [[ "${ALLOW_SCHEMA_MIGRATION:-}" == "1" || "${ALLOW_SCHEMA_MIGRATION:-}" == "true" ]] || { echo "MIGRATE_ON_START requires ALLOW_SCHEMA_MIGRATION=1." >&2; exit 1; }
  bash "$project_dir/scripts/migrate.sh"
  node "$project_dir/server/create-admin.js"
fi
server_pid=''; client_pid=''
cleanup(){ [[ -n "$server_pid" ]] && kill "$server_pid" 2>/dev/null || true; [[ -n "$client_pid" ]] && kill "$client_pid" 2>/dev/null || true; }
trap cleanup EXIT INT TERM
(cd server && PORT="$server_port" npm start) & server_pid=$!
(cd client && ./node_modules/.bin/vite --host "${CLIENT_HOST:-127.0.0.1}" --port "$client_port") & client_pid=$!
wait "$server_pid" "$client_pid"
