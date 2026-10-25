# Phase 3 — Match the mockups

This file replaces Phase 3 in [AUDIT.md](AUDIT.md) section 7. It does not replace Phase 1 or Phase 2, and it does not open a second audit.

Start only after Phase 1 (`fix/phase-1-security`) and Phase 2 are merged to `main`. Work in this repository. Do not unpack a zip, and do not commit `node_modules`, `vendor`, or `.env`.

Section 9 of the audit already marks F-16, F-17, F-18, and F-19 fixed. Stage A checks those claims against the running screens. Fix a gap. Do not file a new finding for the same issue.

## Brand

Follow `docs/design/Marqetise-UI-Mockups.pdf`. Put these tokens in the Tailwind 4 `@theme` block in `frontend/src/index.css` and use them. Do not propose another palette.

| Token | Value | Use |
| --- | --- | --- |
| `--color-blue` | `#113DA5` | Primary actions, small text links on white |
| `--color-brand` | `#F36A09` | Large buttons, accents, 2px focus outline |
| `--color-navy-950` | `#070B14` | Hero background |
| `--color-navy-900` | `#0B1220` | Hero and dark panels |
| `--font-sans` | Plus Jakarta Sans, then Inter | Plus Jakarta Sans for headings, Inter for body |

Orange `#F36A09` on white is about 3:1. It is for controls at 18px bold or larger, and for the focus outline. Small text on white is `#113DA5`.

Use a grey placeholder block until real photography is supplied. Do not add stock photos or generated images. Do not invent statistics, testimonials, client names, prices, addresses, phone numbers, or legal text. The sample figures and the Market Street address on the PDF stay out.

## What to keep

Sticky header. Mobile navigation is a drawer. Admin tables become stacked cards below 768px. Motion is short and turns off under `prefers-reduced-motion: reduce`.

Clear hierarchy, with the content first. Touch targets are at least 44×44px. Spacing follows an 8px grid.

## Build rules

- Set `scroll-margin-top` on anchor targets so the sticky header does not cover them.
- Stacking order, and nothing else: content `0`, sticky header `40`, drawer `50`, modal `60`, toast `70`.
- Set `min-w-0` on grid and flex children that hold text or tables. A missing `min-w-0` is what made a study layout millions of pixels tall.
- Add a dependency only when the pull request for that stage asks for it and the review approves it. Playwright, axe-core, and Lighthouse wait until Stage E, and they are devDependencies.
- At the start of Stage A, record the production-build gzip size of the main JS and the CSS. No later stage may ship a larger main JS or CSS gzip.

## Stages

Each stage is one branch and one pull request. Stop when the pull request is open. The next stage starts only after that pull request is merged.

| Stage | Branch | Work | Then stop |
| --- | --- | --- | --- |
| A | `fix/phase-3-measure` | Run the app. List which F-16–F-19 items are still visible. Record the bundle sizes. No visual redesign. | Pull request |
| B | `fix/phase-3-tokens` | Apply the tokens, the two fonts, the z-index scale, `scroll-margin-top`, and `min-w-0`. | Pull request |
| C | `fix/phase-3-public` | Bring the React public screens in line with the PDF: header, home, courses, contact, book. Skeletons for loading. An error is not an empty state. | Pull request |
| D | `fix/phase-3-admin` | Admin sign-in, shell, dashboard, and lists. One local account per role, created for this stage and listed in `docs/ui-audit/accounts.md` without a password. | Pull request |
| E | `fix/phase-3-verify` | Run the checks below. Save before-and-after screenshots in `docs/ui-audit/`. | Pull request |

The public Bixom HTML template is not restyled in this phase. Stages C and D cover `frontend/src`.

## How to run it

Laravel at `http://127.0.0.1:8000`. The React app at `http://localhost:5173`, with the Vite proxy to that API. Seed with `php artisan migrate --seed`. Roles come from `RolePermissionSeeder`: super-admin, administrator, content-editor, marketing-staff, instructor, student-support, read-only. There is no staff user in `DatabaseSeeder`. Stage D creates one local user for each role before any admin screen is called tested. A spinner or an error page is a failed check, not a pass.

## Pass marks

Checked viewports are 320, 390, 768, and 1440. The header, the menus, and the forms are also checked at 360, 414, 834, 1024, and 1280. On a screen that has the state, check loading, empty, error, and success. Do not multiply every page by every width by every state.

| Check | Pass |
| --- | --- |
| Playwright | No horizontal overflow on admin lists at 320. An in-page anchor is not hidden under the sticky header. |
| axe-core | No serious or critical issues on home, contact, the course list, admin sign-in, and the dashboard. |
| Lighthouse | Accessibility score at least 95 on `/` and `/admin/login`, mobile and desktop. |
| Targets | Every nav control, button, and form control on a checked screen is at least 44×44px. |
| Contrast | Small text at least 4.5:1. Large text and UI parts at least 3:1. |
| Screenshots | `docs/ui-audit/before/` and `docs/ui-audit/after/` for each screen Stage C or D changed. |

## Out of scope

Phase 1 security, Phase 2 behaviour, encrypting student records, soft deletes, new enquiry types, and any payment or enrolment confirmation.
