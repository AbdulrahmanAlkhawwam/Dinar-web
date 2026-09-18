# Dinar Web Dashboard — Design

**Date:** 2026-09-18
**Status:** phases 1–3 implemented
**Repo:** https://github.com/AbdulrahmanAlkhawwam/Dinar-web

## Goal

A web dashboard over the Dinar NestJS API, covering the finance ledger
(operations, currencies), the catalog (products, categories), and user
administration. It wears the visual language of the Dinar Flutter app, laid
out for a desktop screen.

## What the API gives us

Base URL `https://dinar-api-rust.vercel.app/api/v1`. OpenAPI at
`/api/docs-json`. Source of truth is the NestJS project at `../dinar-api`; the
published spec is incomplete in places, so this design follows the source.

| Area | Endpoints | Guard |
|------|-----------|-------|
| Auth | `register`, `login`, `refresh`, `logout` | `logout` needs a bearer |
| Users | full CRUD on `/users` | **none — see Risks** |
| Categories | list/get public, write admin-only | `JwtAuthGuard + AdminGuard` |
| Products | list/get public, write admin-only | `JwtAuthGuard + AdminGuard` |
| Currencies | list public, write admin-only | `JwtAuthGuard + AdminGuard` |
| Operations | full CRUD, all routes | `JwtAuthGuard`, scoped to `sub` |

Constraints this puts on the dashboard:

1. **Token shapes differ per route.** `login` returns
   `{user, accessToken, refreshToken}`; `register` returns
   `{user, accessToken}` with no refresh token; `refresh` returns
   `{accessToken}` alone. Access tokens last 15 minutes, refresh tokens 7
   days, stored bcrypt-hashed and cleared on logout.
2. **Operations are per-user, never per-tenant.** `OperationsService.findAll`
   filters on the JWT's `sub`. There is no admin view across users' ledgers,
   and this dashboard will not pretend otherwise.
3. **No aggregation endpoint.** Summaries and charts are computed client-side
   over a date range pulled with the existing `from` and `to` filters.
4. **No upload endpoint.** Product and category images are URL strings.
5. **Two response envelopes.** `/products` and `/operations` return
   `{data, meta: {page, limit, total, totalPages}}`; `/categories`,
   `/currencies` and `/users` return bare arrays.
6. **Rates are snapshotted.** An operation stores `exchangeRate` and
   `amountInUSD` at write time. Editing `amount` keeps the original rate and
   recomputes USD from it; only changing `currencyId` pulls in today's rate.
   The edit form warns in that one case. (An earlier draft of this spec said
   any amount edit re-priced the row — `OperationsService.update` says
   otherwise.)

## Architecture

Next.js App Router, TypeScript strict, Tailwind, TanStack Query, React Hook
Form with Zod, Recharts.

### Backend-for-frontend

The browser never holds a token and never calls the Dinar API directly.

- `app/api/auth/{login,register,logout,session}/route.ts` own the token
  lifecycle. Tokens live in `httpOnly, secure, sameSite=lax` cookies. Register
  calls `auth/register` then `auth/login`, because register alone yields no
  refresh token.
- `app/api/dinar/[...path]/route.ts` proxies data requests, attaching the
  bearer. On a 401 it calls `auth/refresh` once, rewrites the access cookie
  and retries; on failure it clears both cookies and returns 401, which the
  query client turns into a redirect to `/login`.
- `proxy.ts` (Next 16's renamed middleware) gates the `(app)` route group on the refresh cookie and
  reads `role` from the JWT payload to hide admin-only navigation. This is a
  UX affordance only — enforcement stays in `AdminGuard` on the server.

### Types

Zod schemas hand-written in `lib/schemas/`, mirroring the Prisma models rather
than generated from the OpenAPI document, which types `CreateUserDto` and
`UpdateUserDto` as `{}`, types nullable strings as `object`, and gives list
responses no schema at all. Runtime parsing means a backend change surfaces as
a named error instead of a blank cell.

### Layout

```
app/
  (auth)/login, (auth)/register
  (app)/page.tsx          overview — KPIs and charts
  (app)/operations        ledger table, filters, create/edit
  (app)/currencies        rates CRUD (admin)
  (app)/products          search/sort/filter, CRUD (admin)
  (app)/categories        CRUD (admin)
  (app)/users             CRUD (admin)
  (app)/settings          profile, theme
lib/
  server/session.ts       cookie read/write, refresh
  api/                    one typed module per domain
  schemas/                entities, DTOs, envelopes
  analytics/aggregate.ts  pure summary math
components/ui/            button, input, table, dialog, card
```

## Design system

Ported from `../Dinar/lib/core/constants/` — the Flutter app is the source of
truth, not the older mint-and-teal mockups.

- **Brand triad, identical in both themes:** primary `#68E571`, secondary
  `#00B380`, tertiary `#008091`. Surfaces are pure white and pure black with
  neutral greys; no hue in the chrome.
- **Known contrast cost, carried over:** `#68E571` on white is 1.61:1, so
  filled primary controls get elevation in light mode to give them an edge.
  Label contrast is never in doubt (10.67:1 on primary).
- **Money is not error.** An expense is not an error state, so income and
  expense get their own tokens: light `#0E6B44` and `#A8352B`, dark `#6BD79E`
  and `#FF9E93`.
- **Category hues:** the eight light values with their dark twins, resolved at
  paint time so a category reads as itself in either mode.
- **Shape:** pill (999px) for buttons, fields and chips; 22px cards; 14px
  inner fills. Focus is a 2px ring in `primary`, error the same ring in
  `error`.
- **Type:** Poppins. The Flutter scale's sizes and weights carry over; its
  line-height ratios do not — several are below 1.0 and one was a documented
  bug. The web scale defines its own leading.

Every token becomes a CSS custom property on `:root` and `.dark`, consumed
through Tailwind theme extensions. Contrast pairs get a test, mirroring
`color_contrast_test.dart`.

## Screens

**Operations** is the centerpiece: a table over `{data, meta}` with
server-side pagination, `type` and `from`/`to` filters held in the URL, and a
create/edit dialog. The amount field pairs with a currency picker and previews
the resulting `amountInUSD` live, at the rate the API will actually store,
with an explicit warning when a currency change will replace the recorded
rate.

**Overview** aggregates a week, month or year into income, expense and net
KPIs and a cash-flow chart, all from pure functions in `lib/analytics/`. The
chart plots income above the baseline and expense below it: the money text
colours are a red/green pair that collapses for deuteranopes in dark mode
(palette validator: deutan ΔE 2.3), so position carries identity and colour
only reinforces it. Marks use their own validated `--color-chart-*` tokens.
A data table is one click away. If a range has more rows than the browser
can page through (50 × 100), the figures are flagged as incomplete rather
than shown quietly low.

**Products, categories, currencies, users** are conventional admin tables with
dialog forms. Image fields are URL inputs with a preview.

## Errors

Nest returns `{message, statusCode}`, and `ValidationPipe` returns `message`
as a **string array** for 400s. One `ApiError` normalizes both. Field-level
messages map back onto form fields; everything else becomes a toast. A 403
renders an explicit "administrator access required" state rather than an empty
table.

## Testing

Vitest, Testing Library, and `scripts/mock-api.mjs` — an in-memory Dinar API
mirroring the service rules the dashboard depends on (`npm run dev:mock`). Test-first on the logic
where bugs are invisible: aggregation math, refresh-and-retry, Zod schemas,
colour contrast. Component tests on the operation form. No Playwright for now.

## Delivery

1. **Foundation** — scaffold, token port, BFF proxy, login and register, app
   shell, theme toggle
2. **Finance** — operations, currencies, overview analytics
3. **Catalog** — products, categories
4. **Users** — admin table, role gating

## Risks

- **`/users` is unguarded and stores plaintext passwords.** The controller has
  no `@UseGuards`, and `UsersService.create` writes the DTO straight to Prisma
  while `CreateUserDto` accepts `role`. Anyone can mint an ADMIN account and
  unlock every admin-guarded write. Tracked as separate backend work; the
  dashboard's Users screen should not ship before it lands.
- **Client-side aggregation degrades** past a few thousand operations in one
  range. The fix, when needed, is `GET /operations/summary` in SQL.
- **CORS is wide open** (`app.enableCors()` with no options) on the API. The
  BFF means the dashboard does not depend on that, but it remains true.
