# Frontend API Endpoints

Reference for every `/api/f/*` route, for use by the admin frontend project (and any reader/author-facing client).

- **Base path**: `/api/f/*` (global prefix `api` + `FrontendController` prefix `f`, see `src/main.ts` and `src/common/decorators/route.decorator.ts`).
- **Auth**: routes require a valid **User** (blog writer) JWT via `F_JwtAuthGuard`, sent as `Authorization: Bearer <token>`. Routes marked `@OptionalAuth()` work both logged-out and logged-in — pass a token to get personalized data (e.g. ownership flags), omit it for the public view.
- **Mutating routes** (POST/PATCH/DELETE that aren't public creation) additionally carry `UserStatusGuard` at the method level, which blocks banned/suspended users even though they hold a valid token.
- **Ownership**: for owner-only actions (edit/delete own post or comment), the service checks `resource.userId === authUser.id`; staff are not distinguished on this side — this is the user-facing surface only. See `docs/backoffice-api-endpoints.md` for staff moderation of the same models.
- **Pagination**: most list endpoints extend `PaginationPageLimitDto` — `page` (default `1`), `limit` (default `10`), both optional numeric query params. Comment/reply list endpoints are the exception and use **cursor pagination** instead (`cursor?`, `limit` default `5`, min `1`) — see `docs/api-response-shapes.md#cursor-pagination`.
- **Enums**: all `status` columns are plain `Int` codes. See [Enum Reference](#enum-reference) at the bottom.
- Full request/response schemas are also live in Swagger at `/api/docs`.

---

## Model: User

Blog writers (content authors). Table: `User` (`id`, `username`, `email`, `password`, `name`, `status`, `isVerified`, `verifyCode`, `verifyCodeExpiresAt`, `createdAt`, `updatedAt`).

Controllers: `F_AuthController` (`src/modules/frontend/auth/`), `F_UserController` (`src/modules/frontend/user/`).

### Auth — `/api/f/auth/user`

| Method | Endpoint | Auth | Description | Body |
|---|---|---|---|---|
| POST | `/api/f/auth/user/register` | public | Register a new User (blog author) | `{ username, email, password (min 8 chars), name? }` |
| POST | `/api/f/auth/user/verify_email` | public | Verify a User's email with the code sent at registration | `{ email, verifyCode (6-digit string) }` |
| POST | `/api/f/auth/user/login` | public | Log in with email or username, returns JWT access token + profile | `{ identifier (email or username), password }` |

### Self-service & public profile — `/api/f/users`

| Method | Endpoint | Auth | Description | Params / Query / Body |
|---|---|---|---|---|
| GET | `/api/f/users/me` | required | Get my private profile | — |
| PATCH | `/api/f/users/me` | required + status | Update my profile (name/username/email) | Body: `{ name?, username?, email? }` |
| PATCH | `/api/f/users/me/password` | required + status | Update my password (verifies current password) | Body: `{ currentPassword, newPassword (min 8 chars) }` |
| DELETE | `/api/f/users/me` | required + status | Deactivate my account (sets status to `INACTIVE`) | — |
| GET | `/api/f/users/top` | optional | Public: all-time top authors ranked by published post count | Query: `page?`, `limit?` |
| GET | `/api/f/users/trending` | optional | Public: trending authors by comments received recently | Query: `days?` (default `30`), `page?`, `limit?` |
| GET | `/api/f/users/:username` | optional | Public: author profile (`username`/`name`/`createdAt`) + their published posts | Param: `username` |

---

## Model: Category

Editorial classification for posts (read-only on this side — creation/editing is backoffice-only). Table: `Category` (`id`, `name`, `status`, `createdAt`, `updatedAt`).

Controller: `CategoryController` (`src/modules/frontend/category/`).

### `/api/f/categories`

| Method | Endpoint | Auth | Description | Params / Query |
|---|---|---|---|---|
| GET | `/api/f/categories` | optional | List all categories | Query: `search?`, `status?` (`CategoryStatus`), `sortBy?` (`createdAt`\|`name`, default `createdAt`), `sortOrder?` (`asc`\|`desc`, default `desc`), `page?`, `limit?` |
| GET | `/api/f/categories/:id` | optional | Get category by id | Param: `id` (int) |
| GET | `/api/f/categories/:id/posts` | optional | Get category with its posts | Param: `id` (int) |

---

## Model: Post

Articles, owned by a `User`, optionally linked to a `Category`. Table: `Post` (`id`, `title`, `slug`, `content`, `coverImage`, `status`, `userId`, `categoryId`, `createdAt`, `updatedAt`).

Controller: `PostController` (`src/modules/frontend/post/`).

### `/api/f/posts`

| Method | Endpoint | Auth | Description | Params / Query / Body |
|---|---|---|---|---|
| GET | `/api/f/posts` | optional | List posts (published; logged-in caller also sees ownership context) | Query: `search?`, `status?` (`PostStatus`), `categoryId?` (int), `userId?` (int), `sortBy?` (`createdAt`\|`title`, default `createdAt`), `sortOrder?` (`asc`\|`desc`, default `desc`), `page?`, `limit?` |
| GET | `/api/f/posts/me` | required | Get my posts (all statuses) for my dashboard | Query: same list filters as above |
| GET | `/api/f/posts/:slug` | optional | Get a single post by slug | Param: `slug` (string) |
| GET | `/api/f/posts/:id/comments` | optional | Get top-level (approved, non-reply) comments for a post | Param: `id` (int) · Query: `cursor?` (int), `limit?` (default `5`) |
| POST | `/api/f/posts` | required + status | Create a new post (owned by me) | Body: `{ title, content, slug?, coverImage?, categoryId? }` |
| PATCH | `/api/f/posts/:id` | required + status + owner | Update title/content/category/status (self can only archive) | Param: `id` (int) · Body: `{ title?, content?, categoryId?, status? (ARCHIVED only) }` |
| PATCH | `/api/f/posts/:id/slug` | required + status + owner | Update post slug | Param: `id` (int) · Body: `{ slug }` |
| PATCH | `/api/f/posts/:id/cover-image` | required + status + owner | Update post cover image | Param: `id` (int) · Body: `{ coverImage }` |
| DELETE | `/api/f/posts/:id` | required + status + owner | Delete my post | Param: `id` (int) |

---

## Model: Comment

Belongs to a `Post`, and now **always** to a `User` — guest comments (`guestName`/`guestEmail`) have been removed; only logged-in authors can comment. Comments support a single level of replies via a self-relation (`parentId`/`replies`) — replying to a reply is rejected. Table: `Comment` (`id`, `content`, `status`, `postId`, `userId`, `parentId`, `createdAt`, `updatedAt`).

Controller: `CommentController` (`src/modules/frontend/comment/`). Top-level comment listing is reachable via the nested `GET /api/f/posts/:id/comments` route (see Post section above), not from `/api/f/comments` directly.

Comments no longer go through a moderation queue on this side — new comments are created with status `APPROVED` immediately. Staff-side moderation (viewing all statuses, changing status) lives on the backoffice side now — see `docs/backoffice-api-endpoints.md`.

### `/api/f/comments`

| Method | Endpoint | Auth | Description | Params / Query / Body |
|---|---|---|---|---|
| POST | `/api/f/comments` | required + status | Create a comment or reply as me (auto-approved) | Body: `{ postId (int), content, parentId? (int, top-level comment id to reply to) }` |
| PATCH | `/api/f/comments/:id` | required + status + owner | Update my comment's content | Param: `id` (int) · Body: `{ content }` |
| DELETE | `/api/f/comments/:id` | required + status + owner | Delete my comment or reply | Param: `id` (int) |
| GET | `/api/f/comments/:parentId/replies` | optional | Get replies (approved) to a top-level comment | Param: `parentId` (int) · Query: `cursor?` (int), `limit?` (default `5`) |

Notes on `POST /api/f/comments`:
- `parentId` must reference an existing **top-level** comment (`parentId === null`) on the same `postId` — replying to a reply, or to a comment on a different post, returns `400`.
- Omit `parentId` entirely for a top-level comment.

---

## Not yet exposed on the frontend side

- **Newsletter** — no `/api/f/*` subscribe/unsubscribe endpoints exist yet.
- Forgot/reset password for `User` — not implemented (see `// forgot password?` TODO in `f_auth.controller.ts`); only `Staff` has this flow today.

---

## Enum Reference

Source of truth: `src/lib/coreconstants.ts`.

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

**CommentStatus** — comments created via `/api/f/comments` are always `APPROVED`; the other values are only ever set/read on the backoffice side (see `docs/backoffice-api-endpoints.md`).
| Value | Meaning |
|---|---|
| 0 | PENDING |
| 1 | APPROVED |
| 2 | SPAM |
| 3 | REJECTED |
| 4 | TRASHED |

**isVerified** (User) — plain `0`/`1` flag, not an enum: `0` = not verified, `1` = verified.
