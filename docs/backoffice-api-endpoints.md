# Backoffice API Endpoints

Reference for every `/api/b/*` route, for use by the admin frontend project.

- **Base path**: `/api/b/*` (global prefix `api` + `BackofficeController` prefix `b`, see `src/main.ts` and `src/common/decorators/route.decorator.ts`).
- **Auth**: every route requires a valid **Staff** JWT (`B_JwtAuthGuard`) — there is no optional-auth path on the backoffice side. Send `Authorization: Bearer <token>`.
- **Roles**: `B_RolesGuard` reads `@Roles(...)` metadata per route. A route with no `@Roles(...)` listed below allows **any authenticated staff member** (ADMIN or EDITOR) through. `StaffRole`: `ADMIN = 1`, `EDITOR = 2` (`src/lib/coreconstants.ts`).
- **Pagination**: unless noted otherwise, list endpoints extend `PaginationPageLimitDto` — `page` (default `1`), `limit` (default `10`), both optional numeric query params.
- **Enums**: all `status`/`role` columns are plain `Int` codes. See [Enum Reference](#enum-reference) at the bottom for the numeric values to send/expect.
- Full request/response schemas are also live in Swagger at `/api/docs`.

---

## Model: Staff

Admins and editors. Table: `Staff` (`id`, `email`, `password`, `name`, `role`, `status`, `resetCode`, `resetCodeExpiresAt`, `createdAt`, `updatedAt`).

Controllers: `B_AuthController` (`src/modules/backoffice/auth/`), `StaffController` (`src/modules/backoffice/staff/`).

### Auth — `/api/b/auth/staff`

| Method | Endpoint | Roles | Description | Body |
|---|---|---|---|---|
| POST | `/api/b/auth/staff/login` | public | Log in as staff, returns JWT access token + staff profile | `{ email, password }` |
| POST | `/api/b/auth/staff/register` | ADMIN | Register a new staff account | `{ email, password, name?, role?, status? }` |
| POST | `/api/b/auth/staff/forgot_password` | public (rate-limited: 3 req / 15 min) | Sends a reset code to the email if registered | `{ email }` |
| POST | `/api/b/auth/staff/reset_password` | public (rate-limited: 5 req / 15 min) | Reset password using the emailed reset code | `{ email, password (min 8 chars), resetCode (6-digit string) }` |

### Staff management — `/api/b/staff`

| Method | Endpoint | Roles | Description | Params / Query / Body |
|---|---|---|---|---|
| GET | `/api/b/staff` | any staff | List all staff | Query: `search?`, `status?` (`StaffStatus`), `role?` (`StaffRole`), `page?`, `limit?` |
| GET | `/api/b/staff/:id` | ADMIN | Get staff by id | Param: `id` (int) |
| PATCH | `/api/b/staff/:id/status` | ADMIN | Update a staff member's status | Param: `id` (int) · Body: `{ status: StaffStatus }` |
| PATCH | `/api/b/staff/:id/role` | ADMIN | Update a staff member's role | Param: `id` (int) · Body: `{ role: StaffRole }` |

---

## Model: User

Blog writers (content authors). Table: `User` (`id`, `username`, `email`, `password`, `name`, `status`, `isVerified`, `verifyCode`, `verifyCodeExpiresAt`, `createdAt`, `updatedAt`). Staff cannot create users here — backoffice only moderates existing accounts (users self-register on the frontend side).

Controller: `B_UserController` (`src/modules/backoffice/user/`).

### `/api/b/users`

| Method | Endpoint | Roles | Description | Params / Query / Body |
|---|---|---|---|---|
| GET | `/api/b/users` | any staff | List all users | Query: `search?`, `status?` (`UserStatus`), `isVerified?` (`0`\|`1`), `sortBy?` (`createdAt`\|`name`\|`username`\|`email`, default `createdAt`), `sortOrder?` (`asc`\|`desc`, default `desc`), `page?`, `limit?` |
| GET | `/api/b/users/:username` | ADMIN, EDITOR | Get a user by username | Param: `username` (string) |
| PATCH | `/api/b/users/:username/status` | ADMIN | Update a user's status (e.g. suspend/ban) | Param: `username` · Body: `{ status: UserStatus }` |
| PATCH | `/api/b/users/:username/verified` | ADMIN | Update a user's verification flag | Param: `username` · Body: `{ isVerified: 0 \| 1 }` |
| DELETE | `/api/b/users/:username` | ADMIN | Delete a user | Param: `username` |

---

## Model: Category

Editorial classification for posts. Table: `Category` (`id`, `name`, `status`, `createdAt`, `updatedAt`).

Controller: `B_CategoryController` (`src/modules/backoffice/category/`).

### `/api/b/categories`

| Method | Endpoint | Roles | Description | Params / Query / Body |
|---|---|---|---|---|
| GET | `/api/b/categories` | any staff | List all categories | Query: `search?`, `status?` (`CategoryStatus`), `sortBy?` (`createdAt`\|`name`, default `createdAt`), `sortOrder?` (`asc`\|`desc`, default `desc`), `page?`, `limit?` |
| GET | `/api/b/categories/:id` | any staff | Get category by id | Param: `id` (int) |
| POST | `/api/b/categories` | ADMIN | Create a category | Body: `{ name, status? (CategoryStatus) }` |
| PATCH | `/api/b/categories/:id` | ADMIN | Update a category | Param: `id` (int) · Body: `{ name?, status? }` (partial of create) |
| DELETE | `/api/b/categories/:id` | ADMIN | Delete a category | Param: `id` (int) |

---

## Model: Post

Articles, owned by a `User`, optionally linked to a `Category`. Table: `Post` (`id`, `title`, `slug`, `content`, `coverImage`, `status`, `userId`, `categoryId`, `createdAt`, `updatedAt`). Backoffice never creates or edits post content directly — it only moderates status and deletes; authoring stays on the frontend side (`src/modules/frontend/post/`).

Controller: `B_PostController` (`src/modules/backoffice/post/`).

### `/api/b/posts`

| Method | Endpoint | Roles | Description | Params / Query / Body |
|---|---|---|---|---|
| GET | `/api/b/posts` | any staff | List all posts | Query: `search?`, `status?` (`PostStatus`), `categoryId?` (int), `userId?` (int), `sortBy?` (`createdAt`\|`title`, default `createdAt`), `sortOrder?` (`asc`\|`desc`, default `desc`), `page?`, `limit?` |
| GET | `/api/b/posts/:slug` | any staff | Get a post by slug | Param: `slug` (string) |
| PATCH | `/api/b/posts/:id/status` | ADMIN, EDITOR | Update post status (e.g. approve/publish/reject) | Param: `id` (int) · Body: `{ status: PostStatus }` |
| DELETE | `/api/b/posts/:id` | ADMIN | Delete a post | Param: `id` (int) |

---

## Not yet exposed on the backoffice side

These Prisma models have no `/api/b/*` controller yet:

- **Comment** — no backoffice moderation endpoints exist yet (comment moderation, per `docs/backoffice-frontend-split-plan.md`, is planned but not built).
- **Newsletter** — no backoffice endpoints exist yet.
- **Test** — scratch/dev model, not part of the API surface.

---

## Enum Reference

Source of truth: `src/lib/coreconstants.ts`.

**StaffRole**
| Value | Meaning |
|---|---|
| 1 | ADMIN |
| 2 | EDITOR |

**StaffStatus**
| Value | Meaning |
|---|---|
| 0 | INACTIVE |
| 1 | ACTIVE |
| 2 | SUSPENDED |
| 3 | TERMINATED |

**UserStatus**
| Value | Meaning |
|---|---|
| 0 | INACTIVE |
| 1 | ACTIVE |
| 2 | SUSPENDED |
| 3 | BANNED |
| 4 | PENDING_VERIFICATION |

**PostStatus**
| Value | Meaning |
|---|---|
| 0 | DRAFT |
| 1 | PENDING_REVIEW |
| 2 | PUBLISHED |
| 3 | SCHEDULED |
| 4 | ARCHIVED |
| 5 | REJECTED |
| 6 | TRASHED |

**CategoryStatus**
| Value | Meaning |
|---|---|
| 0 | INACTIVE |
| 1 | ACTIVE |

**CommentStatus** (defined, not yet used by any backoffice endpoint)
| Value | Meaning |
|---|---|
| 0 | PENDING |
| 1 | APPROVED |
| 2 | SPAM |
| 3 | REJECTED |
| 4 | TRASHED |

**NewsletterSubscriptionStatus** (defined, not yet used by any backoffice endpoint)
| Value | Meaning |
|---|---|
| 0 | UNSUBSCRIBED |
| 1 | SUBSCRIBED |
| 2 | PENDING_CONFIRMATION |

**isVerified** (User) — plain `0`/`1` flag, not an enum: `0` = not verified, `1` = verified.
