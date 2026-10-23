# Marqetise API

Base path: `/api/v1`

The React app authenticates with a Laravel Sanctum session cookie. Call `GET /sanctum/csrf-cookie` before the first `POST`, `PUT`, `PATCH`, or `DELETE`, and send `X-XSRF-TOKEN` from the cookie. Axios does this when `withCredentials` is true.

Successful JSON uses a `data` property. Validation errors return HTTP 422 with an `errors` object. Missing or insufficient permission returns 401 or 403. Production responses do not include stack traces when `APP_DEBUG=false`.

## Public

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/v1/site` | Published settings, sections, services, featured courses, and FAQs |
| GET | `/api/v1/courses` | Published courses. Query: `search`, `category`, `level`, `format`, `sort` |
| GET | `/api/v1/courses/{slug}` | One published course, plus related courses |
| GET | `/api/v1/services` | Published services. The public site lists them at `/services` |
| GET | `/api/v1/services/{slug}` | One published service |
| GET | `/api/v1/pages/{slug}` | One published CMS page |
| POST | `/api/v1/inquiries` | Save a contact, course, or corporate inquiry |
| POST | `/api/v1/bookings` | Save a pending service booking |

`GET /sitemap.xml` and `GET /robots.txt` are outside the API prefix. Admin URLs are disallowed for crawlers.

Inquiry and booking responses include `email_delivered` and `receipt_sent`. `email_delivered` is true only after a staff notification is accepted by a configured mail transport. `receipt_sent` is true only after a receipt to the visitor is accepted by that same transport. Both messages are queued. Run `php artisan queue:work` where `QUEUE_CONNECTION` is not `sync`.

## Authentication

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/api/v1/auth/login` | Email, password, optional `remember` |
| POST | `/api/v1/auth/logout` | End the session |
| GET | `/api/v1/auth/user` | Current staff user and permission slugs |
| POST | `/api/v1/auth/forgot-password` | Always returns `{"message":"If an account exists, we've sent a link."}` |
| POST | `/api/v1/auth/reset-password` | `token`, `email`, `password`, `password_confirmation` |
| PATCH | `/api/v1/account` | Update own name, phone, or password |

Login and password routes are limited to 5 requests a minute per email and IP address. After 10 failed sign-ins for one email within 15 minutes, that email stays locked for 15 minutes and still receives the same error. Authenticated API requests are limited to 60 a minute. Public GET requests are limited to 120 a minute per IP address. Inquiry and booking routes are limited to 5 requests a minute per IP address. `PATCH /account` and `POST /auth/logout` use the authenticated API limit.

## Admin

All admin routes require an active session and a permission.

| Area | Permission | Routes |
| --- | --- | --- |
| Dashboard | `dashboard.view` | `GET /admin/dashboard` |
| Search | any active user | `GET /admin/search?q=` |
| Pages, blocks, FAQs, services | `content.view`, `content.manage` | `/admin/pages`, `/admin/blocks`, `/admin/faqs`, `/admin/services` |
| Courses | `courses.view`, `courses.manage` | `/admin/courses` |
| Inquiries | `inquiries.view`, `inquiries.manage` | `/admin/inquiries`, notes, create student |
| Bookings | `bookings.view`, `bookings.manage` | `/admin/bookings` |
| Students | `students.view`, `students.manage` | `/admin/students` |
| Users | `users.view`, `users.manage` | `/admin/users` |
| Roles | `roles.view`, `roles.manage` | `/admin/roles` |
| Settings | `settings.view`, `settings.manage` | `/admin/settings` |
| Media | `media.manage` | `POST /admin/media` |

A person cannot change their own role, suspend themselves, assign Super Administrator unless they already are one, or remove the last active Super Administrator. The Super Administrator role cannot have permissions removed.

Instructor and Read-Only Staff do not receive `students.view` or `bookings.view`. A role that has `roles.manage` assigns those permissions before either role can open students or bookings. Once assigned, that person sees the shared lists.

HTML submitted to content fields is stripped before it is stored. Page bodies are rendered as text, not as HTML.
