#!/usr/bin/env bash
set -euo pipefail

cd /var/www/html

if [ -n "${DATABASE_URL:-}" ] && [ -z "${DB_URL:-}" ]; then
  export DB_URL="$DATABASE_URL"
fi

if [ -z "${DB_CONNECTION:-}" ]; then
  export DB_CONNECTION=pgsql
fi

mkdir -p storage/framework/{cache,sessions,views} storage/logs storage/app/public bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache

php artisan package:discover --ansi
php artisan storage:link --force >/dev/null 2>&1 || true
php artisan migrate --force --no-interaction

# Roles and missing settings only — safe on every boot.
php artisan db:seed --class=Database\\Seeders\\RolePermissionSeeder --force --no-interaction
php artisan db:seed --class=Database\\Seeders\\SettingsSeeder --force --no-interaction

# Website CMS copy — set RUN_DB_SEED=true for the first deploy, then turn it off
# so later boots do not overwrite published CMS edits.
if [ "${RUN_DB_SEED:-false}" = "true" ]; then
  php artisan db:seed --class=Database\\Seeders\\WebsiteContentSeeder --force --no-interaction
fi

if [ -n "${ADMIN_EMAIL:-}" ] && [ -n "${ADMIN_PASSWORD:-}" ]; then
  # Idempotent after the first boot: unique email fails closed and is ignored.
  php artisan marqetise:create-admin \
    --name="${ADMIN_NAME:-Administrator}" \
    --email="$ADMIN_EMAIL" \
    --password="$ADMIN_PASSWORD" || true
fi

php artisan config:cache
php artisan route:cache
php artisan view:cache

exec /usr/bin/supervisord -n -c /etc/supervisord.conf
