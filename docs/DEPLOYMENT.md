# Deployment

This document describes a same-origin deployment that matches the local design. Confirm the domain, web server, database user, TLS certificate, and mail service before using it.

## Render (auto-deploy from GitHub)

The repo includes a Docker image and a [Render Blueprint](https://render.com/docs/infrastructure-as-code) (`render.yaml`). Every push to `main` rebuilds and deploys the web service when the Blueprint is connected.

### One-time setup

1. Push this repository to GitHub (already used by the Blueprint: `main` branch).
2. Open [New Blueprint Instance](https://dashboard.render.com/select-repo?type=blueprint) (or [New Web Service](https://dashboard.render.com/web/new?onboarding=active) and choose **Blueprint**).
3. Connect the `blinksitsolution-web/marqetise` repo and apply `render.yaml`.
4. Render creates a free Postgres database and a Docker web service.
5. In the web service **Environment** tab, set the `sync: false` values from the Blueprint:

| Variable | Value |
| --- | --- |
| `APP_KEY` | Output of `php artisan key:generate --show` (keep `base64:…`) |
| `APP_URL` | `https://<your-service>.onrender.com` |
| `FRONTEND_URL` | Same as `APP_URL` |
| `SANCTUM_STATEFUL_DOMAINS` | Hostname only, e.g. `<your-service>.onrender.com` (no `https://`) |
| `MAIL_HOST` / `MAIL_USERNAME` / `MAIL_PASSWORD` / `MAIL_FROM_ADDRESS` | Real SMTP mailbox (production refuses `log` / `array` mailers) |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | First Super Admin (password ≥ 12 chars, mixed case, number, symbol; not a common default). Clear `ADMIN_PASSWORD` after the first successful boot |
| `RUN_DB_SEED` | `true` for the first deploy only (loads CMS pages/blocks). Set to `false` afterward so redeploys do not overwrite CMS edits |

6. Leave `SESSION_DOMAIN` empty so the cookie is host-only.
7. Deploy. Health check is `GET /up`. Public site is `/`, admin is `/admin`. Roles and default settings seed on every boot; CMS content only when `RUN_DB_SEED=true`.

Custom domain: add it in Render, then update `APP_URL`, `FRONTEND_URL`, and `SANCTUM_STATEFUL_DOMAINS` to that hostname.

When `APP_ENV=production` and `APP_URL` starts with `https://`, generated links (including pagination) use that https root. Leave `TRUSTED_PROXIES` empty or set it to the TLS terminator only. Do not set it to `*`. `/courses/{slug}` is served by Laravel: a published course returns the detail page, and an unknown slug returns `page-404.html` with HTTP 404. Nginx hides the Laravel copies of `Referrer-Policy` and `X-Frame-Options` so those headers are sent once.

Uploads live on the container disk and are wiped on redeploy unless you later attach an S3-compatible disk (`FILESYSTEM_DISK` / AWS env). Logo and media uploads should be re-uploaded after a fresh deploy on the free plan.

## Assumptions

- One public hostname serves both the React build and the Laravel API.
- HTTPS is terminated by the web server (or by Render in front of the Docker service).
- MySQL 8 is the application database for a self-hosted deploy. The Render Blueprint uses Postgres (`DB_CONNECTION=pgsql`).
- PHP 8.3 or newer is available, matching Laravel 13.
- Mail is configured separately. Until it is, inquiries are stored and the API reports that email was not sent. Production still requires `MAIL_MAILER` to be a real transport (`smtp`, etc.), not `log` or `array`.

## Build

```bash
cd frontend
npm ci
npm run build
```

The public site is the static HTML in `frontend/` (`index.html` and `page-*.html`). `npm run build` writes the admin SPA to `frontend/dist`. Copy `frontend/dist/assets` next to `admin.html` when the same host serves the admin. Do not commit `frontend/dist`. Do not publish `frontend/dist` source maps. The Vite build sets `sourcemap: false`.

## Security headers

Laravel sends these headers on API and web responses: `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`, `Content-Security-Policy: frame-ancestors 'none'`, and `Permissions-Policy: camera=(), microphone=(), geolocation=()`. `Strict-Transport-Security` is added only when `APP_ENV=production`.

The static host that serves the public HTML must send its own headers, because those HTML and asset responses do not pass through Laravel. A copyable nginx example is `docs/deploy/spa.conf.example`. It sends a report-only content security policy, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, and HSTS. Pretty paths such as `/about` and `/book` are rewritten to the matching `page-*.html` file, and `/courses/{slug}` is rewritten to `page-course-details.html`. Unknown paths return 404. Start with report-only, watch the browser console for violations, then rename that header to `Content-Security-Policy`. Do not treat the Vite dev server as production.

```
Content-Security-Policy-Report-Only: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'
```

`style-src` allows inline styles because a few components set a height or width in a `style` attribute. `connect-src 'self'` matches a same-origin API. Add the API origin there if the site and API use different hostnames. After a clean report-only period, replace the header name with `Content-Security-Policy`. Also send `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options: DENY`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`, and HSTS on the static host.

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

Inquiry receipts, booking receipts, and the matching staff notices are sent during the request. They do not use the queue. A missing `queue:work` process cannot turn a queued job into a “receipt has been sent” message, because those four messages are not queued. Password-reset and invitation mail use Laravel’s notification and are also sent during the request.

`APP_ENV` must be set to `production` in the environment before the application boots in production. A checkout with no `APP_ENV` is treated as unconfigured so `composer install` can finish. After `php artisan config:cache`, the production safety checks still run from the cached config. Do not deploy a production host that has neither `APP_ENV=production` nor a config cache built from that value.

Nothing in the application currently implements a queued job. If you later queue work, run a worker. An example supervisor program is in `docs/deploy/queue-worker.conf.example`. `QUEUE_CONNECTION=sync` runs jobs during the request and does not need that worker. The example default remains `database` so a forgotten worker fails closed for any future queued job instead of silently pretending to send mail. These four messages no longer depend on that choice.

`SEED_SAMPLE_CONTENT` defaults to false. When it is true, the starter courses are saved as drafts. Privacy and terms stay draft until the finished text is published. Public uploads are served only through the `public/storage` link created by `storage:link`. Do not expose `backend/storage` as a web root. GIF uploads are rejected. Review every published page in the CMS before launch.

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
- `TRUSTED_PROXIES` set to the address of the TLS terminator only. Leave it empty when PHP sees the client directly. Do not set it to `*`.
- Database credentials for a dedicated MySQL user, not root and not an empty password
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

Serve `index.html` for `/`, `page-about.html` for `/about`, `page-services.html` for `/services`, `page-courses.html` for `/courses`, `page-contact.html` for `/contact`, `page-book.html` for `/book`, `page-privacy.html` for `/privacy`, and `page-terms.html` for `/terms`. Send `/courses/{slug}` to Laravel, which serves `page-course-details.html` for a published course and a 404 page otherwise. Serve `admin.html` for `/admin`. Do not add a static `public/robots.txt`. That file would be served before the Laravel route. `GET /robots.txt` must be the route, which disallows `/admin` and `/api`.

The static file server in `frontend/scripts/static-server.cjs` sends `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, `Content-Security-Policy: frame-ancestors 'none'`, a report-only content security policy, and `Permissions-Policy`. It does not send HSTS, because that header belongs on the TLS host in `docs/deploy/spa.conf.example`.

`php artisan marqetise:backup` writes a copy under `storage/app/backups` only when `BACKUP_ENABLED=true`. The daily schedule calls it, and it does nothing while the flag is false. `php artisan marqetise:forget-ip-addresses` clears inquiry and audit IP addresses only after a staff member saves a number of days under Settings. Leave that field blank until the privacy page's `[IP ADDRESS RETENTION PERIOD]` is a real period, and use the same number in both places. Neither command chooses a period or a proxy address. `TRUSTED_PROXIES` stays empty until it lists only the TLS terminator. Add a cron entry for `php artisan schedule:run` every minute so those two commands can run. Copy backup files off the server. Do not serve `storage/app/backups`.

Take a database backup before every migration and keep the dump off the server. Do not put the database password on the command line:

```bash
mysqldump --single-transaction --no-tablespaces --host="$DB_HOST" --user="$DB_USERNAME" --password "$DB_DATABASE" > "marqetise-$(date +%F).sql"
```

`--password` with no value prompts. Restore is a manual owner step: load that file into a new database and point `.env` at it. The booking slot migration stops if two pending or confirmed rows already share a date and time. The student-email and FAQ migrations stop if duplicates already exist. None of those migrations delete rows.

`GET /up` runs `select 1`. A database outage returns HTTP 503 and `{"status":"down"}`. It does not include the database error.

`backend/scripts/create-database.php` refuses to run as `root` or with an empty password. Pass `DB_USERNAME`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`, and `DB_DATABASE` in the environment. It does not print the password.

Point the document root at files that are meant to be public. Do not expose `backend/.env` or `backend/storage`.

The storage link must be writable by the PHP user. Take a database backup before every migration. Do not run `migrate:fresh` on a production database.

## After release

- Sign in as the administrator created with the Artisan command and replace starter contact details.
- Confirm a contact inquiry is stored and, if mail is configured, that the notification arrives.
- Confirm a draft page and a draft course stay off the public site.
- Confirm a Content Editor receives HTTP 403 when calling a user-management route.
