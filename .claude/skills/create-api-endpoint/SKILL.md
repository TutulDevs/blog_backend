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
2. **Decide which side this endpoint belongs to: backoffice or frontend.**
   This decision drives everything else (module location, guard, DTO shape),
   so make it before writing any files. See "API surface split" below. If a
   model needs both a staff-facing endpoint and a user-facing endpoint for the
   same action (e.g. updating a `Post`), that's the dual-surface case — you'll
   be writing two of everything (DTO + service method + controller route), not
   one shared implementation.
3. Check whether the feature module already exists under
   `src/modules/backoffice/<feature>/` or `src/modules/frontend/<feature>/`.
   If it does, extend it (add a method/route) rather than re-scaffolding.

Read one sibling module in full before writing anything — e.g.
`src/modules/backoffice/user/` for a backoffice example,
`src/modules/frontend/post/` for a frontend one. Section 1a below tells you
what to look for so one pass covers it, instead of re-deriving these
conventions file-by-file every time. For the full architectural rationale and
a per-model migration plan, see `docs/backoffice-frontend-split-plan.md`.

## 1. File layout

Feature modules live under `src/modules/backoffice/<feature>/` or
`src/modules/frontend/<feature>/` depending on the decision from step 0.2 —
never a bare `src/modules/<feature>/` and never one module serving both
sides:

```
src/modules/<backoffice|frontend>/<feature>/
  dto/
    <feature>.dto.ts   # all DTOs for the feature in one file: Create/Update/GetAllQuery/etc.
  <feature>.controller.ts
  <feature>.service.ts
  <feature>.module.ts
```

Register the new module in `BackofficeModule.imports`
(`src/modules/backoffice/backoffice.module.ts`) or `FrontendModule.imports`
(`src/modules/frontend/frontend.module.ts`) — **not** directly in
`AppModule`, which only imports those two aggregate modules.

## 1a. Codebase-specific conventions

These are settled patterns in this repo (verified against
`src/modules/backoffice/staff/`, `src/modules/backoffice/user/`,
`src/modules/frontend/post/`, and `src/common/guards/`) — apply them directly
instead of re-discovering them per endpoint. Re-verify by grepping if a
convention here seems stale (e.g. a decorator/guard renamed).

### API surface split

Full detail in `CLAUDE.md`'s "API Surface Split" section and
`docs/backoffice-frontend-split-plan.md`. Summary:

- **Backoffice** (`/api/b/*`) — Staff (ADMIN/EDITOR) only: moderation, admin
  management of other users'/authors' content or accounts. Placement rule of
  thumb: if the action _moderates or administers someone else's_ content or
  account, it's backoffice.
- **Frontend** (`/api/f/*`) — User self-service on their own account/content,
  plus public reads. Placement rule of thumb: if the action is _self-service
  on your own account/content_, or a _public read_, it's frontend.
- **Dual-identity auth model.** `Staff` (admin/editor, has `role`) and `User`
  (blog author/content writer, no `role` field) are separate Prisma models,
  both signing tokens with the same JWT secret but different payload shapes:
  - Staff token payload: `{ id, email, role }`
  - User/author token payload: `{ id, username, status }` — **no `role` key**
  - Shared types live in `src/common/guards/auth-payload.types.ts`:
    `StaffJwtPayload`, `UserJwtPayload`, `AuthenticatedUser` (the union),
    `isStaffUser(user)` (the type guard — use this, not a manual
    `typeof user.role === 'number'` check), `RequestWithStaff`.

### Guard wiring — pick one side, never mix

- **Backoffice controller**: `@UseGuards(B_JwtAuthGuard, B_RolesGuard)` on the
  controller class (`src/common/guards/b_jwt_auth.guard.ts` /
  `roles.guard.ts`). `B_JwtAuthGuard` always requires a valid Staff-shaped
  token — it has no optional-auth path, since backoffice has no public
  routes. `B_RolesGuard` is a no-op pass-through (any authenticated staff
  member allowed) on any route without `@Roles(StaffRole.ADMIN, ...)`
  metadata, so it's safe to apply broadly and tune per-route with `@Roles()`.
- **Frontend controller**: `@UseGuards(F_JwtAuthGuard)` on the controller
  class (`src/common/guards/f_jwt_auth.guard.ts`). Requires a valid
  User-shaped token; rejects staff-shaped tokens. Add `@OptionalAuth()`
  (`src/common/decorators/optional_auth.decorator.ts`) per-route for
  endpoints that should work both logged-out and logged-in (public
  reader-facing GETs) — lets the guard skip its throw when no/invalid token
  is present, while still populating `request.user` if a valid one is. For
  mutating routes (POST/PATCH/DELETE), also add `@UseGuards(UserStatusGuard)`
  at the **method** level (`src/common/guards/user_status.guard.ts`) to block
  banned/suspended users — method-level, not controller-wide, so it doesn't
  also gate the optional-auth GETs.
- **Never** reintroduce a single shared "JwtAuthGuard" that branches on
  `request.originalUrl` to decide staff-vs-user. Which guard you attach to a
  controller _is_ the enforcement — that's the entire point of the split.
- `@UserEntity()` param decorator (`src/common/decorators/user.decorator.ts`)
  pulls `request.user: AuthenticatedUser` into a handler — works on either
  side.
- **Ownership pattern** for frontend resources owned by a `User`/author row:
  compare `resource.userId === authUser.id` in the service method. Backoffice
  methods for the same model need no ownership check — staff acts on any
  row. Mirrors `PostService`'s planned `updatePostAsAuthor` (ownership
  checked) vs `updatePostAsStaff` (not checked) split.

### Route & Swagger tag decorators

- `@BackofficeController('<path>')` / `@FrontendController('<path>')`
  (`src/common/decorators/route.decorator.ts`) instead of the bare
  `@Controller()` — these produce the `b/...` / `f/...` prefix that combines
  with the global `api` prefix (set in `main.ts`) into `/api/b/...` /
  `/api/f/...`.
- `@BackofficeApiTags('<name>')` / `@FrontendApiTags('<name>')`
  (`src/common/decorators/api_tag.decorator.ts`) instead of the bare
  `@ApiTags()`, so Swagger groups routes under `[B] <name>` / `[F] <name>`.

### Naming convention

Backoffice controllers/services/modules get a `B_` prefix (`B_UserController`,
`B_UserService`, `B_UserModule`). Frontend ones get an `F_` prefix only where
a name would otherwise collide with a backoffice counterpart of the same
feature (`F_AuthController` next to `B_AuthController`); a plain feature name
(`PostController`, `CategoryService`) is fine on the frontend side when there
is no backoffice counterpart sharing that exact name.

### Dual-surface models

When the same row can be edited by both a staff member (full access) and its
owning User (partial, self-service access) — e.g. `Post` — give each side its
**own DTO and own service method**. Never share one "update everything" DTO
or one service method with an `if (isStaff)` branch across both sides: the
DTO's `class-validator` whitelist (`whitelist: true`, set globally) is what
actually enforces which fields each side can touch at the HTTP layer, and a
shared DTO silently defeats that. Concretely: `UpdatePostStaffDto` (all
fields) + `PostService.updatePostAsStaff(...)` in the backoffice controller,
`UpdatePostAuthorDto` (restricted fields) + `PostService.updatePostAsAuthor(...)`
(ownership-checked) in the frontend controller.

### Service/Prisma conventions

- Prisma `omit` (not `select`) strips sensitive fields, e.g.
  `{ password: true, resetCode: true } as Prisma.<Model>Omit`.
- Map `Prisma.PrismaClientKnownRequestError` codes explicitly:
  `P2002` (unique constraint) → `ConflictException`; `P2003` (FK violation)
  → `BadRequestException`.
- Paginated list methods return `{ meta: { totalCount, page, limit,
totalPages }, list }`; single-record methods return `{ <entityName>:
record }` (e.g. `{ user }`, `{ post }`) — not the bare record.
- List-query DTOs extend `PaginationPageLimitDto`
  (`src/common/dto/pagination.dto.ts`); `sortBy`/`sortOrder` use
  `@IsIn([...])` allow-lists with defaults (`sortBy = 'createdAt'`,
  `sortOrder: 'asc' | 'desc' = 'desc'`).
- When a model uses a human-readable unique field (e.g. `User.username`) as
  its public lookup key instead of the numeric `id`, prefer that field in the
  route param (`:username`) and `where` clause for backoffice single-record
  lookups/mutations, matching `B_UserController`'s `:username`-based routes.

**Response envelope:** `TransformPostInterceptor`
(`src/common/interceptors/transform_post.interceptor.ts`), applied via
`@UseInterceptors(TransformPostInterceptor)` on the controller class, wraps
every response in `{ code, data, timestamp }`. Because of this, a delete
endpoint should return a small body (e.g. `{ message: 'X deleted
successfully' }`) with `@HttpCode(HttpStatus.OK)` rather than a true empty
204 — a 204 with a wrapped body is a contradiction.

## 2. DTOs

- One DTO per write operation (`Create...Dto`, `Update...Dto`), not a shared
  "generic" DTO — and not shared across backoffice/frontend for a
  dual-surface model (see above).
- Use `class-validator` decorators matching the Prisma field constraints:
  optional Prisma fields (`String?`) → `@IsOptional()`; required fields →
  `@IsNotEmpty()` / appropriate `@Is...()`; enums → `@IsEnum(Role)`.
- `UpdateDto` should typically be `export class UpdateXDto extends
PartialType(CreateXDto) {}` from `@nestjs/swagger` (keeps Swagger docs and
  optionality in sync) — except for the dual-surface case, where the
  restricted-field DTO is its own explicit shape, not a `PartialType` of the
  full one.
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

- `@BackofficeController('<feature>')` + `@BackofficeApiTags('<feature>')`,
  or `@FrontendController('<feature>')` + `@FrontendApiTags('<feature>')` —
  per the side decided in step 0.2.
- One method per route, thin — just calls the service and returns the
  result.
- Annotate every route with `@ApiOperation({ summary: '...' })` and the
  relevant `@ApiResponse({ status, description })` entries (success + main
  error cases).
- Use proper HTTP method decorators and status codes: `@Post()` (201 is
  default for POST), `@Get()`, `@Get(':id')`, `@Patch(':id')`, `@Delete(':id')`
  with `@HttpCode(204)` if it returns nothing (but see the response-envelope
  note above — this repo returns `HttpStatus.OK` with a small body instead).
- Validate route params with `ParseIntPipe` (or similar) for numeric IDs:
  `@Param('id', ParseIntPipe) id: number`.
- If the route must be authenticated, guard it per the "Guard wiring"
  section above (`B_JwtAuthGuard`+`B_RolesGuard` for backoffice,
  `F_JwtAuthGuard` [+`UserStatusGuard` on mutations] for frontend) and add
  `@ApiBearerAuth()`. Don't invent a new auth scheme.

## 5. Module

```ts
@Module({
  controllers: [XController],
  providers: [XService],
  exports: [XService], // only if other modules need it
})
export class XModule {}
```

`PrismaModule` doesn't need to be imported here if it's `@Global()`. Import
`AuthModule` (`src/modules/auth/auth.module.ts`) if the controller uses
either JWT guard, then register this module in `BackofficeModule.imports` or
`FrontendModule.imports` per step 1.

## 6. Verify - skip for now

1. `yarn run build` — must compile clean.
2. `yarn run start:dev`, then open `/api/docs` and confirm the new route
   appears under the correct `[B]`/`[F]` Swagger tag with correct
   request/response schemas.
3. Exercise the route (curl or Swagger UI) for the happy path and at least
   one validation-error / not-found case. For a dual-surface endpoint,
   verify both sides independently: a staff token must be rejected by
   `F_JwtAuthGuard` and a user token must be rejected by `B_JwtAuthGuard`.
4. `yarn run lint`.
5. Add/update a `<feature>.service.spec.ts` or `.controller.spec.ts` only if
   the user asked for tests or the repo already has test coverage for
   sibling modules — don't introduce a testing pattern that doesn't exist
   elsewhere in the repo.

## Non-goals

- Don't build a generic CRUD-generator abstraction — write each resource's files directly, matching the shape of any existing modules in the repo.
- Don't add pagination, filtering, or caching unless asked — a plain list endpoint is enough until the user needs more.
- Don't touch unrelated modules or refactor existing endpoints while adding a new one.
- Don't put a backoffice and frontend concern in the same controller/service "for convenience" — even a tiny admin-only endpoint gets its own backoffice controller, not a `@Roles()`-decorated method bolted onto a frontend one (that decorator does nothing without `B_RolesGuard`, which frontend controllers don't carry).
