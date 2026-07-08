# Agents Context File (Agents.md)

This file provides architectural context, tech stack rules, and database guidelines for all AI agents working on this codebase.

## Project Overview
A backend API service for a **Blog Management Site (CMS)** supporting editorial publishing workflows, user authentication, and reader-facing content feeds.

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

## Codebase Architecture (NestJS Conventions)
- **Modular Design**: Group logic by features using NestJS modules (e.g., `src/auth/`, `src/posts/`, `src/categories/`).
- **Dependency Injection**: Always use NestJS decorators (`@Injectable()`, `@Controller()`, `@Module()`) to manage dependency injections. Do not instantiate services manually.
- **DTOs & Validation**: Use `class-validator` and `class-transformer` for request validation in Data Transfer Objects (DTOs).
- **Prisma Integration**: Utilize a shared `PrismaService` extending `PrismaClient` to handle database connections.
- **Environment Variables**: Use NestJS `@nestjs/config` Module to manage environment properties.

## Database Entities (Prisma)
- **User**: Represents authors, editors, and admins.
- **Post**: Represents articles (connected to an Author/User, and optional Category).
- **Category**: Represents editorial classifications for posts.

## Media Upload & Static Files
- Uploaded media should be saved locally in a `/uploads` folder at the project root.
- The NestJS app must serve this folder statically using `ServeStaticModule` mapped to the `/uploads` path prefix.

## Email Dispatch
- Utilize SendGrid's API key credentials for sending out user registration confirmations, notifications, or newsletters.
