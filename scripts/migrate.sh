#!/usr/bin/env bash
set -euo pipefail
project_dir="$(cd "$(dirname "$0")/.." && pwd)"; cd "$project_dir"
if [[ -z "${DATABASE_URL:-}" ]]; then
  [[ -f .env ]] || { echo "Missing DATABASE_URL; configure the intended app database." >&2; exit 1; }
  set -a; . ./.env; set +a
fi
: "${DATABASE_URL:?DATABASE_URL is required}"
node server/seed.js --migration-only "$@"
