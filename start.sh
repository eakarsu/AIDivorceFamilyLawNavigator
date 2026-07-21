#!/usr/bin/env bash
set -euo pipefail
project_dir="$(cd "$(dirname "$0")" && pwd)"; cd "$project_dir"
[[ -f .env ]] || { echo "Missing .env; copy .env.example and configure it." >&2; exit 1; }
[[ -d server/node_modules && -d client/node_modules ]] || { echo "Dependencies missing; run scripts/bootstrap.sh." >&2; exit 1; }
set -a; . ./.env; set +a
server_pid=''; client_pid=''
cleanup(){ [[ -n "$server_pid" ]] && kill "$server_pid" 2>/dev/null || true; [[ -n "$client_pid" ]] && kill "$client_pid" 2>/dev/null || true; }
trap cleanup EXIT INT TERM
(cd server && npm start) & server_pid=$!
(cd client && npm run dev -- --host "${CLIENT_HOST:-127.0.0.1}") & client_pid=$!
wait "$server_pid" "$client_pid"

