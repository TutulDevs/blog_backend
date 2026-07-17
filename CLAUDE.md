# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A backend API service for a Blog Management Site (CMS) supporting editorial publishing workflows, user authentication, and reader-facing content feeds.

## Tech Stack

- **Framework**: NestJS (v10+)
- **Language**: TypeScript
- **Database**: PostgreSQL (Docker-based default, with local Postgres option)
- **ORM**: Prisma ORM
- **Authentication**: JWT-based session tokens
- **Email Service**: SendGrid
- **Image Storage**: Local storage (served statically at `/uploads`)
- **API Documentation**: Swagger (`@nestjs/swagger`) at `/api/docs`
- **Testing**: Jest & `@nestjs/testing`
- **Package Manager**: Yarn

## Codebase Architecture (NestJS Conventions)

- **Modular Design**: Group logic by features using NestJS modules under `src/modules/backoffice/<feature>/` or `src/modules/frontend/<feature>/` (see API Surface Split below) — never a bare `src/<feature>/`.
- **Dependency Injection**: Always use NestJS decorators (`@Injectable()`, `@Controller()`, `@Module()`) to manage dependency injections. Do not instantiate services manually.
- **DTOs & Validation**: Use `class-validator` and `class-transformer` for request validation in Data Transfer Objects (DTOs).
- **Prisma Integration**: Utilize a shared `PrismaService` extending `PrismaClient` to handle database connections.
- **Environment Variables**: Use NestJS `@nestjs/config` Module to manage environment properties.

## API Surface Split: Backoffice vs Frontend

The API is structurally split into two namespaces that must never mix — separate
modules, separate guards, separate DTOs. See `docs/backoffice-frontend-split-plan.md`
for the full per-model migration plan and pattern this section summarizes.

- **`/api/b/*` (backoffice)** — Staff (ADMIN/EDITOR) only. Moderation and admin actions:
  banning/verifying users, publishing/rejecting posts, moderating comments, managing
  categories. Lives under `src/modules/backoffice/<feature>/`.
- **`/api/f/*` (frontend)** — User (blog writer) self-service and public reads. Lives
  under `src/modules/frontend/<feature>/`.
- Prefixes come from `@BackofficeController('<path>')` / `@FrontendController('<path>')`
  (`src/common/decorators/route.decorator.ts`) combined with the global `api` prefix set
  in `main.ts` — do not use the bare `@Controller()` decorator on feature controllers.
  Mirror with `@BackofficeApiTags('<name>')` / `@FrontendApiTags('<name>')` for Swagger
  grouping.
- **Naming convention**: backoffice controllers/services/modules get a `B_` prefix
  (`B_UserController`, `B_UserService`, `B_UserModule`); frontend ones get an `F_` prefix
  where a name would otherwise collide with a backoffice counterpart (`F_AuthController`).
  Plain feature names (`PostController`, `CategoryService`) are fine on the frontend side
  when there's no backoffice counterpart with the same name yet.

### Guards (never mix these across the two sides)

- **Backoffice**: `@UseGuards(B_JwtAuthGuard, B_RolesGuard)` on the controller class.
  `B_JwtAuthGuard` (`src/common/guards/b_jwt_auth.guard.ts`) always requires a valid
  Staff-shaped token — it has **no optional-auth path**, since every backoffice route is
  staff-only. `B_RolesGuard` reads `@Roles(StaffRole.ADMIN, StaffRole.EDITOR, ...)`
  metadata per-route; a route with no `@Roles(...)` allows any authenticated staff
  member through.
- **Frontend**: `@UseGuards(F_JwtAuthGuard)` on the controller class.
  `F_JwtAuthGuard` (`src/common/guards/f_jwt_auth.guard.ts`) requires a valid User-shaped
  token, but supports `@OptionalAuth()` (`src/common/decorators/optional_auth.decorator.ts`)
  for routes that should work both logged-out and logged-in (public reader-facing GETs).
  For mutating routes (POST/PATCH/DELETE), additionally add
  `@UseGuards(UserStatusGuard)` at the **method** level (not controller-wide, so it
  doesn't block optional-auth GETs) to block banned/suspended users
  (`src/common/guards/user_status.guard.ts`).
- Shared payload types (`StaffJwtPayload`, `UserJwtPayload`, `AuthenticatedUser`,
  `isStaffUser`, `RequestWithStaff`) live in the neutral
  `src/common/guards/auth-payload.types.ts` — import from there, not from either guard
  file, to avoid the backoffice/frontend guards depending on each other.
- **Never** re-add a single shared `JwtAuthGuard` that branches on `request.originalUrl`
  to decide staff-vs-user — that was the old pattern and it's gone. Which guard you
  attach to a controller *is* the enforcement.

### Dual-surface models (e.g. `Post`)

When the same row can be edited by both a staff member (full access) and its owning
User (partial, self-service access), give each side its **own DTO and own service
method** — never one shared "update everything" DTO reused across both. The DTO's
`class-validator` whitelist (`whitelist: true` in the global `ValidationPipe`) is what
actually enforces which fields each side can touch; a shared DTO with an `if (isStaff)`
branch in the service does not enforce that boundary at the HTTP layer. Only the
author-facing method needs an ownership check (`resource.userId === authUser.id`); the
staff-facing method does not.

## Database Entities (Prisma)

Staff (editorial team) and User (content writers) are kept in **separate tables** — they are not a single "user" model.

- **Staff**: Admins and editors (`src/prisma`). Has `role` (`ADMIN`/`EDITOR`), `status`, and `resetCode` (used for the forgot-password flow). Does not user posts.
- **User**: Blog writers. Has `username`, `status`, and a `posts`/`comments` relation. Authenticates and writes content, but has no `role` field.
- **Post**: Articles, connected to an `User` (not `Staff`) and an optional `Category`. Has a `status` field (draft/published/etc.) instead of a plain boolean.
- **Category**: Editorial classification for posts, with its own `status`.
- **Comment**: Belongs to a `Post`, optionally to an `User` (nullable, so guest comments are supported via `guestName`/`guestEmail`), with a moderation `status`.
- **Newsletter**: Email subscriber list with a `status` (subscribed/unsubscribed/pending).

### Status & Role Enums

Every `status`/`role` column above is a plain numeric `Int` in Prisma (Prisma enums are string-backed only, so they can't express numeric codes). The authoritative numeric values live in `src/lib/coreconstants.ts` — always import and use these enums (`StaffRole`, `StaffStatus`, `UserStatus`, `PostStatus`, `CommentStatus`, `CategoryStatus`, `NewsletterSubscriptionStatus`) instead of hardcoding integers when reading or writing these columns.

## Media Upload & Static Files

- Uploaded media should be saved locally in a `/uploads` folder at the project root.
- The NestJS app must serve this folder statically using `ServeStaticModule` mapped to the `/uploads` path prefix.

## Email Dispatch

- Utilize SendGrid's API key credentials for sending out user registration confirmations, notifications, or newsletters.

## Environment Variables

Managed via `@nestjs/config`, loaded from a root `.env` (gitignored). Known variables:

- `DATABASE_URL` — PostgreSQL connection string.
- `SENDGRID_API_KEY` / `SENDGRID_FROM_EMAIL` — SendGrid credentials for email dispatch.
- `PORT` — HTTP port for the Nest app (defaults to `3000`).

## Common Commands

- `yarn start:dev` — run the app in watch mode.
- `yarn build` — compile to `dist/`.
- `yarn lint` — ESLint with autofix.
- `yarn test` / `yarn test:e2e` / `yarn test:cov` — Jest unit/e2e/coverage.
- `yarn prisma:push` — push the Prisma schema to the database (`prisma db push`).
- `yarn prisma:seed` — run `prisma/seed.ts` (seeds the initial super admin `Staff` record).
- `yarn db:setup` — push schema then seed, in one step.
- Swagger docs are served at `/api/docs` once the app is running.

# Trello Guardrails

- Never fetch an entire board or deep-read lists unless explicitly asked.
- Always use specific card IDs or precise text searches (`search_cards`) to find items.
- If creating a card, keep the description under 2-3 sentences. Do not dump code blocks into Trello descriptions.
