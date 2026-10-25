# Marqetise

Marqetise is a digital marketing website and staff admin application. The public site and the admin dashboard are a React application. The API, database, and permissions are a Laravel application.

The repository started with brand files and interface mockups only. There was no existing application to preserve.

## Applications

- `frontend` — React 19, Vite, Tailwind CSS, React Router
- `backend` — Laravel 13, PHP 8.3, MySQL, Laravel Sanctum
- Tests — PHPUnit for the API, Vitest and Testing Library for the interface

## Local development

This machine uses Laragon. PHP 8.3.26 is the working binary (`php-8.3.30` in Laragon does not contain `php.exe`). MySQL 8.4 is already installed.

From PowerShell:

```powershell
$env:Path = "C:\laragon\bin\php\php-8.3.26-Win32-vs16-x64;C:\laragon\bin\composer;" + $env:Path
cd C:\laragon\www\Marqetise\backend
copy .env.example .env
php artisan key:generate
php artisan migrate
php artisan db:seed
php artisan storage:link
php artisan serve --host=127.0.0.1 --port=8000
```

In a second terminal:

```powershell
cd C:\laragon\www\Marqetise\frontend
npm install
npm run dev
```

Open http://localhost:5173. The Vite server proxies `/api`, `/sanctum`, `/storage`, `/sitemap.xml`, and `/robots.txt` to Laravel, so the browser stays on one origin and the session cookie works.

`backend/.env.example` sets `SESSION_SECURE_COOKIE=false` so that cookie is stored on local HTTP. Production must set `SESSION_SECURE_COOKIE=true`. The application refuses to boot in production when that flag is false.

### First administrator

There is no public registration page and no default password in the repository.

```powershell
php artisan marqetise:create-admin --name="Your Name" --email="you@example.com" --password="a-long-unique-password"
```

The password must be at least 12 characters and include upper and lower case, a number, and a symbol.

`php artisan db:seed` loads roles, editable website copy, services, and starter courses taken from the approved mockups. It does not create a staff account. It also does not invent testimonials, statistics, team members, client names, or awards. Those sections stay hidden until real content is published.

Set `SEED_SAMPLE_CONTENT=false` before seeding a production database if the starter courses should not be published.

## What the application does

- Public pages: home, about, courses, course details, contact, book a service, and published CMS pages such as privacy and terms.
- Contact inquiries and booking requests are saved in MySQL. A booking is pending until a staff member confirms it. Course enrolment is an inquiry, not a payment.
- Email is sent only when `MAIL_MAILER` is a real transport. The default `log` driver writes mail to `backend/storage/logs/laravel.log` and the interface says that email was not delivered.
- Admin areas: dashboard, CMS, courses, inquiries, bookings, students, users, permissions, and settings.
- Roles: Super Administrator, Administrator, Content Editor, Marketing Staff, Instructor, Student Support, and Read-Only Staff. Laravel checks the permission on every restricted request.

## Tests and build

```powershell
cd backend
php artisan test

cd ..\frontend
npm test
npm run lint
npm run build
```

## Deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md). The API is documented in [docs/API.md](docs/API.md).

The hosting provider for production was not specified. Do not point this application at a live server until the domain, HTTPS certificate, database user, and mail transport are confirmed.
