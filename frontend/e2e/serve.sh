#!/usr/bin/env bash
# Local-only servers for the About image browser test. Uses a throwaway sqlite file.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
API_PORT="${E2E_API_PORT:-8041}"
WEB_PORT="${E2E_WEB_PORT:-5211}"
DB="${E2E_DB:-/tmp/marqetise-e2e-about.sqlite}"

rm -f "$DB"
mkdir -p "$(dirname "$DB")"

export APP_ENV=local
export APP_DEBUG=true
export APP_KEY="${APP_KEY:-base64:YWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWE=}"
export APP_URL="http://127.0.0.1:${WEB_PORT}"
export DB_CONNECTION=sqlite
export DB_DATABASE="$DB"
export DB_URL=
export SESSION_DRIVER=file
export SESSION_DOMAIN=
export SESSION_SECURE_COOKIE=false
export SANCTUM_STATEFUL_DOMAINS="127.0.0.1:${WEB_PORT},127.0.0.1:${API_PORT},localhost,127.0.0.1"
export CACHE_STORE=file
export QUEUE_CONNECTION=sync
export MAIL_MAILER=log

cd "$ROOT/backend"
php artisan migrate --force --no-interaction
php artisan db:seed --class=Database\\Seeders\\RolePermissionSeeder --force --no-interaction
php artisan db:seed --class=Database\\Seeders\\WebsiteContentSeeder --force --no-interaction
php << 'PHP'
<?php
require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
$role = App\Models\Role::query()->where('slug', 'content-editor')->firstOrFail();
App\Models\User::query()->updateOrCreate(
    ['email' => 'media-e2e@example.com'],
    [
        'name' => 'Media E2E',
        'password' => 'password',
        'status' => 'active',
        'role_id' => $role->id,
        'email_verified_at' => now(),
    ],
);
PHP

php artisan serve --host=127.0.0.1 --port="$API_PORT" >/tmp/marqetise-e2e-php.log 2>&1 &
API_PID=$!
cleanup() {
  kill "$API_PID" >/dev/null 2>&1 || true
}
trap cleanup EXIT INT TERM

for _ in $(seq 1 50); do
  if curl -sf "http://127.0.0.1:${API_PORT}/api/v1/site" >/dev/null; then
    break
  fi
  sleep 0.2
done

cd "$ROOT/frontend"
export MARQ_API_PROXY="http://127.0.0.1:${API_PORT}"
export MARQ_DEV_PORT="$WEB_PORT"
npx vite --config vite.e2e.config.mjs --host 127.0.0.1 --port "$WEB_PORT"
