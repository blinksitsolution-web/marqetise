# Deployment

Production hosting was not provided, so this document describes a same-origin deployment that matches the local design. Confirm the domain, web server, database user, TLS certificate, and mail service before using it.

## Assumptions

- One public hostname serves both the React build and the Laravel API.
- HTTPS is terminated by the web server.
- MySQL 8 is the application database.
- PHP 8.3 or newer is available, matching Laravel 13.
- Mail is configured separately. Until it is, inquiries are stored and the API reports that email was not sent.

## Build

```bash
cd frontend
npm ci
npm run build
```

Copy `frontend/dist` to the directory your web server uses for the public site, or let Laravel serve `index.html` for non-API routes if you choose a single document root. Do not commit `frontend/dist`.

## Laravel

```bash
cd backend
composer install --no-dev --optimize-autoloader
php artisan key:generate
php artisan migrate --force
php artisan db:seed --force
php artisan storage:link
php artisan config:cache
php artisan route:cache
php artisan marqetise:create-admin --name="..." --email="..." --password="..."
```

For a production database, set `SEED_SAMPLE_CONTENT=false` if the starter courses from the mockups should not be published. Review every published page in the CMS before launch.

## Environment

Set these in `backend/.env`. Do not commit that file.

- `APP_ENV=production`
- `APP_DEBUG=false`
- `APP_URL=https://your-domain`
- `FRONTEND_URL=https://your-domain`
- `SANCTUM_STATEFUL_DOMAINS=your-domain`
- `SESSION_DRIVER=database`
- `SESSION_SECURE_COOKIE=true`
- `SESSION_DOMAIN=your-domain`
- Database credentials for a dedicated MySQL user, not the Laragon root account
- `MAIL_MAILER`, host, port, username, and password for the real mailbox
- `MAIL_FROM_ADDRESS` for the address recipients should see

`VITE_API_URL` can stay empty when the site and API share a hostname. Set it only for a split-origin deployment, and add that origin to `config/cors.php` and `SANCTUM_STATEFUL_DOMAINS`. Never put the application key, database password, or mail password in a `VITE_` variable.

## Web server

Route these paths to Laravel:

- `/api`
- `/sanctum`
- `/storage`
- `/sitemap.xml`
- `/robots.txt`
- `/up`

Serve the React `index.html` for every other path, including `/admin`, so the client router can load. `robots.txt` disallows `/admin` and `/api`.

Point the document root at files that are meant to be public. Do not expose `backend/.env` or `backend/storage`.

The storage link must be writable by the PHP user. Take a database backup before every migration. Do not run `migrate:fresh` on a production database.

## After release

- Sign in as the administrator created with the Artisan command and replace starter contact details.
- Confirm a contact inquiry is stored and, if mail is configured, that the notification arrives.
- Confirm a draft page and a draft course stay off the public site.
- Confirm a Content Editor receives HTTP 403 when calling a user-management route.
