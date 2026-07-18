# CLAUDE.md

This file instructs Claude Code on how to build this project. Read it fully before writing any code.

## What this project is

An admin panel (backoffice) web app for a Blog Management CMS. It is a pure API client — all
business logic, validation, and auth live in the existing NestJS backend. This app only
renders UI and calls that API.

The full contract for every endpoint this app is allowed to call — method, path, required role,
params, query, and body shape — is in **`backoffice-api-endpoints.md`** in this same folder.
Treat that file as the source of truth. Do not invent endpoints, fields, or query params that
aren't listed there. If something you need isn't in that file, stop and ask rather than guessing
the backend shape.

## Tech stack

- **Framework**: Next.js (App Router), TypeScript
- **UI**: shadcn/ui (Tailwind-based) — install components via the shadcn CLI as needed, don't hand-roll primitives it already provides (Button, Input, Table, Dialog, Dropdown, Form, Select, Badge, Sonner/Toast, etc.)
- **Forms**: react-hook-form, with zod schemas for validation (`@hookform/resolvers/zod`)
- **Server state / data fetching**: @tanstack/react-query — all API calls go through it (queries for reads, mutations for writes), no ad-hoc `useEffect` fetching
- **HTTP client**: a small typed fetch wrapper (or `ky`/`axios` if you prefer) that attaches the `Authorization: Bearer <token>` header and centralizes the base URL and error handling
- Package manager: yarn (match the backend repo's convention)

## Auth model (read this before building anything else)

- This is the **backoffice** side only — logs in via `POST /api/b/auth/staff/login`, gets a JWT
  for a **Staff** (ADMIN or EDITOR), not a User. There is no self-registration flow in the UI —
  `POST /api/b/auth/staff/register` itself now requires an already-authenticated ADMIN token, so
  it's an "invite a colleague" action available from inside the admin panel once logged in, not a
  public signup page.
- Every `/api/b/*` route requires a valid Staff JWT. Store it (httpOnly cookie via a Next.js route
  handler, or at minimum not in plain localStorage if you can avoid it) and attach it as
  `Authorization: Bearer <token>` on every API call.
- Some routes are `ADMIN`-only (see the "Roles" column in `backoffice-api-endpoints.md`); others
  allow any authenticated staff member. Read the logged-in staff's `role` from the JWT/profile
  response and hide or disable admin-only actions in the UI for EDITOR accounts — but don't treat
  that as the real access control; the backend already enforces it, the UI hiding is just UX.
- On a 401 from any API call, clear the session and redirect to `/login`. On a 403, show a
  "not permitted" state rather than redirecting.

## Build order (do this incrementally, basics first)

Build and verify each step before moving to the next. Don't scaffold every page up front.

1. **Project scaffold**: `create-next-app` with TypeScript + Tailwind + App Router, install
   shadcn/ui and initialize it, install react-hook-form + zod + @tanstack/react-query.
2. **API client layer**: typed fetch wrapper + a `.env.local` var for the backend base URL
   (e.g. `NEXT_PUBLIC_API_URL=http://localhost:3000/api` — confirm the backend's actual port
   from its own `.env`/`PORT` setting rather than assuming 3000). One typed function per
   endpoint in `backoffice-api-endpoints.md`, grouped by model (`lib/api/staff.ts`,
   `lib/api/users.ts`, `lib/api/categories.ts`, `lib/api/posts.ts`).
3. **Auth**: login page (`POST /api/b/auth/staff/login`), session storage/cookie handling,
   route protection (middleware or layout guard) for everything under an authenticated
   section, logout.
4. **App shell**: authenticated layout with sidebar nav (Dashboard / Users / Categories /
   Posts / Staff), current-staff display, logout button.
5. **Categories** (simplest model — good one to prove the CRUD pattern end to end): list page
   with the table + search/status filter + pagination, create dialog, edit dialog, delete
   confirmation. ADMIN-only actions (create/update/delete) hidden for EDITOR role.
6. **Users**: list page with search/status/verified filters + pagination, detail view,
   status update action, verify toggle, delete (all ADMIN-only per the endpoints doc).
7. **Posts**: list page with search/status/category/author filters + pagination, detail view,
   status update action (ADMIN + EDITOR), delete (ADMIN-only).
8. **Staff**: list page with search/status/role filters, detail view, status update, role
   update, and the "invite new staff" form that hits `POST /api/b/auth/staff/register`
   (ADMIN-only, requires being logged in — do not build this as a public page).
9. Only after all of the above work end to end: revisit polish (loading/empty/error states
   everywhere, toasts on mutation success/failure, optimistic updates where it makes sense).

## Conventions

- One React Query hook per endpoint (e.g. `useCategories(query)`, `useCreateCategory()`),
  colocated with the API function or in a matching `hooks/` folder — don't call `fetch`
  directly from components.
- Enum values (status/role codes) are plain integers on the wire — see the "Enum Reference"
  section at the bottom of `backoffice-api-endpoints.md`. Define matching TypeScript enums/
  const objects once and reuse them for both the label mapping (badges, selects) and the
  values you send back to the API — don't hardcode magic numbers in component JSX.
- Don't build Comment or Newsletter management screens — those backoffice endpoints don't
  exist yet (see the "Not yet exposed" section of the endpoints doc).
- No unrequested extras (no dark mode toggle, no i18n, no analytics) unless asked — keep the
  first pass focused on making every documented endpoint usable from the UI.
