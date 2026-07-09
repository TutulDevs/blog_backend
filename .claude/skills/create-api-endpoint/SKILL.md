---
name: create-api-endpoint
description: Scaffold a new REST API endpoint (or CRUD resource) in this NestJS + Prisma backend, following the project's module/controller/service/DTO conventions, Swagger docs, and validation rules. Use when the user asks to add, create, or expose a new API route/endpoint/resource (e.g. "add an endpoint for comments", "expose a GET /posts/:slug route", "create a categories CRUD API").
---

# Create API Endpoint

Scaffold new endpoints the way this codebase expects: NestJS modules with
dependency injection, Prisma for data access, `class-validator` DTOs, and
Swagger annotations. Reuse existing pieces (PrismaService, guards, DTOs)
instead of duplicating them.

## 0. Gather context first

Before writing anything:

1. Read `prisma/schema.prisma` to find the model(s) backing this endpoint. The
   Prisma model is the source of truth for field names, types, optionality
   (`?`), and uniqueness (`@unique`) — DTOs must match it.
2. Check whether `src/prisma/prisma.service.ts` (a `PrismaService extends
PrismaClient`, `@Injectable()`, wired into `onModuleInit`) and a
   `PrismaModule` already exist. If not, create them first as a shared,
   `@Global()` module imported once in `AppModule` — every feature module
   depends on it.
3. Check whether the feature module already exists under `src/<feature>/`. If
   it does, extend it (add a method/route) rather than re-scaffolding.
4. Check `package.json` for `class-validator` and `class-transformer`. If
   absent, install them (`yarn add class-validator class-transformer`) —
   CLAUDE.md requires them for DTO validation.
5. Check `src/main.ts` for a global `ValidationPipe`. If missing, add one
   (`app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform:
true }))`) so DTO decorators are actually enforced.

Do not silently skip a missing prerequisite — fix it as part of the task,
since every endpoint depends on it.

## 1. File layout

For a feature named `<feature>` (e.g. `posts`), create/use:

```
src/<feature>/
  dto/
    create-<feature>.dto.ts
    update-<feature>.dto.ts   # often `extends PartialType(CreateXDto)`
  <feature>.controller.ts
  <feature>.service.ts
  <feature>.module.ts
```

Register the new module in `AppModule.imports` (`src/app.module.ts`).

## 2. DTOs

- One DTO per write operation (`Create...Dto`, `Update...Dto`), not a shared
  "generic" DTO.
- Use `class-validator` decorators matching the Prisma field constraints:
  optional Prisma fields (`String?`) → `@IsOptional()`; required fields →
  `@IsNotEmpty()` / appropriate `@Is...()`; enums → `@IsEnum(Role)`.
- `UpdateDto` should typically be `export class UpdateXDto extends
PartialType(CreateXDto) {}` from `@nestjs/swagger` (keeps Swagger docs and
  optionality in sync).
- Annotate each property with `@ApiProperty()` / `@ApiPropertyOptional()` so
  it shows up correctly in Swagger.
- Never expose Prisma-managed fields (`id`, `createdAt`, `updatedAt`) or
  sensitive fields (`password`) in request DTOs or response payloads.

## 3. Service

- `@Injectable()`, inject `PrismaService` via constructor — never instantiate
  Prisma or other services manually.
- One method per operation (`create`, `findAll`, `findOne`, `update`,
  `remove`), returning plain data (let the controller/interceptors shape the
  HTTP response).
- Throw NestJS HTTP exceptions for expected failures, e.g.
  `NotFoundException` when a lookup misses, `ConflictException` on unique
  constraint violations (Prisma error code `P2002`).
- Keep business logic here, not in the controller.

## 4. Controller

- `@Controller('<feature>')` + `@ApiTags('<feature>')`.
- One method per route, thin — just calls the service and returns the
  result.
- Annotate every route with `@ApiOperation({ summary: '...' })` and the
  relevant `@ApiResponse({ status, description })` entries (success + main
  error cases).
- Use proper HTTP method decorators and status codes: `@Post()` (201 is
  default for POST), `@Get()`, `@Get(':id')`, `@Patch(':id')`, `@Delete(':id')`
  with `@HttpCode(204)` if it returns nothing.
- Validate route params with `ParseIntPipe` (or similar) for numeric IDs:
  `@Param('id', ParseIntPipe) id: number`.
- If the route must be authenticated, guard it with the project's JWT guard
  (check `src/auth/` for an existing `JwtAuthGuard`/`AuthGuard('jwt')`) and
  add `@ApiBearerAuth()`. If no auth module exists yet, flag this to the user
  instead of inventing an auth scheme — auth scaffolding is a separate,
  larger task.

## 5. Module

```ts
@Module({
  controllers: [XController],
  providers: [XService],
  exports: [XService], // only if other modules need it
})
export class XModule {}
```

`PrismaModule` doesn't need to be imported here if it's `@Global()`.

## 6. Verify

1. `yarn run build` — must compile clean.
2. `yarn run start:dev`, then open `/api/docs` and confirm the new route
   appears with correct request/response schemas.
3. Exercise the route (curl or Swagger UI) for the happy path and at least
   one validation-error / not-found case.
4. `yarn run lint`.
5. Add/update a `<feature>.service.spec.ts` or `.controller.spec.ts` only if
   the user asked for tests or the repo already has test coverage for
   sibling modules — don't introduce a testing pattern that doesn't exist
   elsewhere in the repo.

## Non-goals

- Don't build a generic CRUD-generator abstraction — write each resource's
  files directly, matching the shape of any existing modules in the repo.
- Don't add pagination, filtering, or caching unless asked — a plain list
  endpoint is enough until the user needs more.
- Don't touch unrelated modules or refactor existing endpoints while adding
  a new one.
