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

- **Modular Design**: Group logic by features using NestJS modules (e.g., `src/auth/`, `src/posts/`, `src/categories/`).
- **Dependency Injection**: Always use NestJS decorators (`@Injectable()`, `@Controller()`, `@Module()`) to manage dependency injections. Do not instantiate services manually.
- **DTOs & Validation**: Use `class-validator` and `class-transformer` for request validation in Data Transfer Objects (DTOs).
- **Prisma Integration**: Utilize a shared `PrismaService` extending `PrismaClient` to handle database connections.
- **Environment Variables**: Use NestJS `@nestjs/config` Module to manage environment properties.

## Database Entities (Prisma)

Staff (editorial team) and Author (content writers) are kept in **separate tables** — they are not a single "user" model.

- **Staff**: Admins and editors (`src/prisma`). Has `role` (`ADMIN`/`EDITOR`), `status`, and `resetCode` (used for the forgot-password flow). Does not author posts.
- **Author**: Blog writers. Has `username`, `status`, and a `posts`/`comments` relation. Authenticates and writes content, but has no `role` field.
- **Post**: Articles, connected to an `Author` (not `Staff`) and an optional `Category`. Has a `status` field (draft/published/etc.) instead of a plain boolean.
- **Category**: Editorial classification for posts, with its own `status`.
- **Comment**: Belongs to a `Post`, optionally to an `Author` (nullable, so guest comments are supported via `guestName`/`guestEmail`), with a moderation `status`.
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
