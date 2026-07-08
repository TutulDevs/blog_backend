# NestJS Blog Management Backend MVP

We will initialize a backend codebase from scratch in `/my-codes/blog_management/backend` using **NestJS, TypeScript, Prisma ORM, and PostgreSQL**. We will configure database support via Docker (with local database fallback options), local image upload handling, SendGrid email dispatching, and auto-generated Swagger API documentation.

This plan covers the initialization, database schema design, NestJS module architecture, authentication, and core blog post CRUD APIs.

## User Review Required

> [!IMPORTANT]
> - **Database Connection**: You will need to provide a PostgreSQL database connection string in your local `.env` file (pre-configured for Docker Compose).
> - **Prerequisites**: Make sure Node.js (v18+) is installed on your system.

## Proposed Changes

### Infrastructure & Config Component

#### [NEW] [docker-compose.yml](file:///my-codes/blog_management/backend/docker-compose.yml)
Contains the PostgreSQL 15 container definition, exposing port 5432 and utilizing a docker volume for data persistence.

#### [MODIFY] [.env](file:///my-codes/blog_management/backend/.env)
Contains development credentials for Trello, PostgreSQL, and SendGrid placeholders.

### Core NestJS API Component

We will structure the NestJS project using modular folders for clean separation of concerns.

#### [NEW] [package.json](file:///my-codes/blog_management/backend/package.json)
Initializes NestJS dependencies, including `@nestjs/swagger`, `swagger-ui-express`, `@nestjs/serve-static`, `class-validator`, `bcrypt`, and `@sendgrid/mail`.

#### [NEW] [schema.prisma](file:///my-codes/blog_management/backend/prisma/schema.prisma)
Defines the database schema mapping to PostgreSQL for the following entities:
- `User` (email, password hash, role)
- `Post` (title, slug, content, published state, coverImage, relation to User)
- `Category` (name, slug, relation to multiple posts)

#### [NEW] [src/main.ts](file:///my-codes/blog_management/backend/src/main.ts) & [src/app.module.ts](file:///my-codes/blog_management/backend/src/app.module.ts)
Entry points to:
- Enable ValidationPipes and global filters.
- Setup Swagger at `/api/docs`.
- Configure `ServeStaticModule` to serve the `/uploads` folder statically.

#### [NEW] [src/prisma/prisma.service.ts](file:///my-codes/blog_management/backend/src/prisma/prisma.service.ts)
A custom provider to instantiate and manage the connection lifecycle of `PrismaClient`.

#### [NEW] [src/auth/](file:///my-codes/blog_management/backend/src/auth/)
Module containing controllers, services, and DTOs for user registration (`POST /auth/register`) and login with JWT generation (`POST /auth/login`).

#### [NEW] [src/mail/](file:///my-codes/blog_management/backend/src/mail/)
A reusable custom service wrapping `@sendgrid/mail` to dispatch emails.

#### [NEW] [src/posts/](file:///my-codes/blog_management/backend/src/posts/)
Module containing controllers, services, and DTOs for:
- Creating posts (`POST /posts`) with auto-slug generation.
- Handling image uploads using `FileInterceptor` (Multer) to save covers in `/uploads`.
- Reading public feed (`GET /posts`) and detail (`GET /posts/:slug`).
- Updating and deleting posts (`PATCH /posts/:id` and `DELETE /posts/:id`).

## Verification Plan

### Automated Tests
We will set up Jest end-to-end (e2e) tests to verify:
- Admin registration and login flow.
- Rejecting unauthorized users attempting to create posts.
- Successful creation, updating, and listing of posts by authenticated users.
- Mocking SendGrid service calls during integration tests to prevent actual network calls.

### Manual Verification
- Start Docker database: `docker compose up -d`.
- Run the NestJS development server: `npm run start:dev`.
- Open Swagger docs in your browser at `http://localhost:3000/api/docs` and test the endpoints directly from the UI.
- Verify file uploads by uploading a cover image and checking if it is accessible via browser at `http://localhost:3000/uploads/<filename>`.
