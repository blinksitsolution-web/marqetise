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
| GET | `/api/v1/services` | Published services |
| GET | `/api/v1/services/{slug}` | One published service |
| GET | `/api/v1/pages/{slug}` | One published CMS page |
| POST | `/api/v1/inquiries` | Save a contact, course, or corporate inquiry |
| POST | `/api/v1/bookings` | Save a pending service booking |

`GET /sitemap.xml` and `GET /robots.txt` are outside the API prefix. Admin URLs are disallowed for crawlers.

Inquiry and booking responses include `email_delivered`. That value is true only after Laravel accepts the message for a configured mail transport.

## Authentication

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/api/v1/auth/login` | Email, password, optional `remember` |
| POST | `/api/v1/auth/logout` | End the session |
| GET | `/api/v1/auth/user` | Current staff user and permission slugs |
| POST | `/api/v1/auth/forgot-password` | Same response whether or not the email exists |
| POST | `/api/v1/auth/reset-password` | `token`, `email`, `password`, `password_confirmation` |
| PATCH | `/api/v1/account` | Update own name, phone, or password |

Login and password routes are limited to 5 requests a minute. Inquiry and booking routes use the same limit per IP address.

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

HTML submitted to content fields is stripped before it is stored. Page bodies are rendered as text, not as HTML.
