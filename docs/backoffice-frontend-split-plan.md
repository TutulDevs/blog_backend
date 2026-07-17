# Backoffice / Frontend API Separation — Plan

Goal: `/api/b/*` (staff) and `/api/f/*` (users/public) must be structurally separate —
separate guards, separate controllers, separate DTOs — so a staff-only action can never
end up reachable (or silently unreachable) through the wrong side. No shared "one
controller does both" endpoints.

## Why this plan exists

Audit of the current code found the `@Roles(StaffRole...)` decorator used on 4 frontend
controllers (`post`, `comment`, `category`, `user`) with no `RolesGuard` attached to read
it — meaning any logged-in `User` (not staff) can currently call `updatePostStatus`,
`updateCommentStatus`, category create/update/delete, and user admin actions. And even if
the guard were added, `JwtAuthGuard` rejects staff payloads on any `/api/f/*` route, so
staff could never reach those endpoints anyway. This plan fixes both: the guard split and
the module placement.

## Pattern to follow for every model

```
## Model: <Name>

### Guards
- Backoffice: B_JwtAuthGuard [+ B_RolesGuard, @Roles(...) per endpoint]
- Frontend:   F_JwtAuthGuard [+ UserStatusGuard] (or @OptionalAuth() for public reads)

### Backoffice APIs — /api/b/<path>
- METHOD /path — who can call it — what it does — full/partial field access

### Frontend APIs — /api/f/<path>
- METHOD /path — who can call it — what it does — full/partial field access

### Service / DTO split
- How the shared PrismaService-backed service divides staff-full vs user-partial logic
- Which DTOs enforce the field whitelist for each side

### Notes / open questions
- Anything ambiguous that needs a product decision later
```

Rule of thumb for placement: if the action *moderates or administers other people's
content/accounts*, it's backoffice. If the action is *self-service on your own
account/content*, or a *public read*, it's frontend. When the same underlying row can be
touched by both (e.g. a `Post`), give each side its own DTO — never reuse one
"update everything" DTO across both sides, since `class-validator`'s `whitelist: true` is
what actually enforces the field boundary at the HTTP layer.

---

## Phase 0 — Auth guard refactor (prerequisite for everything below)

This has to land first; every per-model migration below depends on it.

1. Move the shared payload types/type-guard out of `jwt_auth.guard.ts` into a neutral
   file, e.g. `src/common/guards/auth-payload.types.ts`:
   `StaffJwtPayload`, `UserJwtPayload`, `AuthenticatedUser`, `isStaffUser`,
   `RequestWithStaff`. Both new guards need these without importing each other.
2. Create **`B_JwtAuthGuard`** (`src/common/guards/b_jwt_auth.guard.ts`): verifies the
   token, then requires `isStaffUser(payload)` — throws `UnauthorizedException` otherwise.
   Keep `@OptionalAuth()` support for parity, even if rarely used on the backoffice side.
3. Create **`F_JwtAuthGuard`** (`src/common/guards/f_jwt_auth.guard.ts`): verifies the
   token, then requires `!isStaffUser(payload)` — throws otherwise. Keep `@OptionalAuth()`
   support (this is used heavily on the frontend side today).
4. Delete the old shared `JwtAuthGuard` and its URL-prefix sniffing
   (`url.startsWith('/api/b')` / `'/api/f'`) entirely — the guard you attach now *is* the
   enforcement, so the runtime path check is redundant and removed.
5. Update every controller's import from `JwtAuthGuard` to `B_JwtAuthGuard` or
   `F_JwtAuthGuard` depending on which module it's in.
6. Wire `UserStatusGuard` onto every `F_JwtAuthGuard`-protected controller for mutating
   routes: `@UseGuards(F_JwtAuthGuard, UserStatusGuard)`. It exists today but is applied
   nowhere, so banned/suspended users currently aren't blocked from anything.

---

## Model: Staff

### Module place: backoffice (already correct, no move needed)

### Guards
- `B_JwtAuthGuard` (+ `B_RolesGuard`, `@Roles(StaffRole.ADMIN)` where already present)

### APIs & logic
No endpoint relocation needed — `B_AuthController` and `StaffController` are already
correctly scoped to backoffice. Just swap their `JwtAuthGuard` import for
`B_JwtAuthGuard` (Phase 0, step 5).

---

## Model: User (blog writer account)

### Module place: split — self-service stays in frontend, admin management moves to backoffice

### Guards
- Backoffice: `B_JwtAuthGuard` + `B_RolesGuard`
- Frontend: `F_JwtAuthGuard` (+ `@OptionalAuth()` on the public profile read)

### Backoffice APIs — /api/b/users (new `B_UserController`, in `backoffice/user/`)
- `GET /` — staff, any role — list all users — moved from `UserController.getAllUsers`
- `GET /:id` — `@Roles(ADMIN, EDITOR)` — moved from `getUserById`
- `GET /username/:username` — `@Roles(ADMIN, EDITOR)` — moved from `getUserByUsername`
- `PATCH /:id` — `@Roles(ADMIN, EDITOR)` — edit name/email — moved from `updateUser`
- `PATCH /:id/status` — `@Roles(ADMIN)` — ban/suspend/activate — moved from `updateUserStatus`
- `PATCH /:id/username` — `@Roles(ADMIN)` — rename — moved from `updateUserUsername`

### Frontend APIs — /api/f/user (trimmed `UserController`)
- `GET /:id_or_username` — `@OptionalAuth()` — public profile lookup — unchanged
- (future) self-service profile update / change password — not yet built

### Service / DTO split
`UserService` keeps its existing methods; they simply get called from the new
`B_UserController` instead. No DTO split needed here since these were never
dual-surface — they were only misplaced.

### Notes
- `UserModule` currently lives fully under `frontend/`. After the move it should export
  `UserService` so a new `backoffice/user/user.module.ts` (or the existing
  `BackofficeModule`) can import it, rather than duplicating the service.

---

## Model: Post

### Module place: split — author self-service stays in frontend, editorial control moves to backoffice

This is the dual-surface case: staff can edit *everything*; a user can only edit their
own post's `title`, `slug`, `content`, `coverImage`, and move status through a restricted
subset of transitions (e.g. draft → pending_review, not → published). Enforce this with
**two DTOs and two service methods**, not one shared DTO with an if-branch — the DTO
whitelist is the actual security boundary here.

### Guards
- Backoffice: `B_JwtAuthGuard` + `B_RolesGuard`
- Frontend: `F_JwtAuthGuard` + `UserStatusGuard` for mutations, `@OptionalAuth()` for reads

### Backoffice APIs — /api/b/posts (new `B_PostController`)
- `GET /` — staff, any role — list all posts including drafts, any author
- `GET /:id` — full detail, any status
- `PATCH /:id` — `@Roles(ADMIN, EDITOR)` — full update via `UpdatePostStaffDto`
  (title, content, slug, coverImage, category, status, author reassignment — everything)
- `PATCH /:id/status` — `@Roles(ADMIN, EDITOR)` — moved from
  `PostController.updatePostStatus`
- `DELETE /:id` — `@Roles(ADMIN, EDITOR)` — delete any post

### Frontend APIs — /api/f/posts (trimmed `PostController`)
- `GET /`, `GET /:username`, `GET /:slug` — `@OptionalAuth()` — unchanged, public reads
- `POST /` — author, must own result — unchanged
- `PATCH /:id` — author-owned only — `UpdatePostAuthorDto` (title, slug, content,
  coverImage only — **no `status` or `category` field**, `whitelist: true` rejects them)
- `PATCH /:id/slug`, `PATCH /:id/cover-image` — author-owned only — unchanged
- `DELETE /:id` — author-owned only, unchanged (consider restricting to `draft` status
  only — open question below)
- Remove `@Roles(StaffRole.ADMIN, StaffRole.EDITOR)` from `updatePostStatus` entirely —
  that endpoint no longer exists on this controller (moved to backoffice above)

### Service / DTO split
- `PostService.updatePostAsStaff(id, dto: UpdatePostStaffDto, staffId)` — no ownership
  check, full field access
- `PostService.updatePostAsAuthor(id, dto: UpdatePostAuthorDto, userId)` — ownership
  check required, restricted fields only
- Both can share a private field-mapping helper internally; the point is the two public
  entry points have different DTOs and different authorization requirements.

### Notes / open questions
- Exact allowed status transitions for authors (e.g. can a user move their own post back
  from `pending_review` to `draft`?) — needs a product decision, not assumed here.
- Whether authors can delete a published post or only drafts — flagged, not decided.

---

## Model: Category

### Module place: mostly backoffice — frontend keeps read-only access

Categories are an editorial taxonomy; there's no "user's own category" concept, so there's
no dual-surface here — it's a clean move, not a split.

### Guards
- Backoffice: `B_JwtAuthGuard` + `B_RolesGuard`
- Frontend: `F_JwtAuthGuard` not required at all for reads — keep `@OptionalAuth()` only

### Backoffice APIs — /api/b/categories (new `B_CategoryController`)
- `POST /` — `@Roles(ADMIN)` — moved from `CategoryController.createCategory`
- `PATCH /:id` — `@Roles(ADMIN)` — moved from `updateCategory`
- `DELETE /:id` — `@Roles(ADMIN)` — moved from `deleteCategory`

### Frontend APIs — /api/f/categories (trimmed `CategoryController`)
- `GET /`, `GET /:id`, `GET /:id/posts` — `@OptionalAuth()` — unchanged, public reads only

### Service / DTO split
No split needed — `CategoryService`'s write methods just get called from
`B_CategoryController` instead. Remove `UseGuards(JwtAuthGuard)` +
`@Roles()` entirely from the frontend controller since it will have no protected routes
left.

---

## Model: Comment

### Module place: split — create/read/self-edit stays frontend, moderation moves to backoffice

### Guards
- Backoffice: `B_JwtAuthGuard` + `B_RolesGuard`
- Frontend: `F_JwtAuthGuard` (+ `@OptionalAuth()` for guest comments/reads), `UserStatusGuard`
  for mutations

### Backoffice APIs — /api/b/comments (new `B_CommentController`)
- `PATCH /:id/status` — `@Roles(ADMIN, EDITOR)` — moved from
  `CommentController.updateCommentStatus`
- (optional, if a moderation queue is wanted) `GET /`, `DELETE /:id` for any comment —
  flagged as open question below

### Frontend APIs — /api/f/comments (trimmed `CommentController`)
- `POST /` — `@OptionalAuth()` — logged-in author or guest — unchanged
- `GET /`, `GET /:id` — `@OptionalAuth()` — unchanged, public reads
- `PATCH /:id` — owner-only — edit own comment content — unchanged
- `DELETE /:id` — owner-only — delete own comment — unchanged
- Remove `@Roles(StaffRole.ADMIN, StaffRole.EDITOR)` from `updateCommentStatus` entirely
  — moved to backoffice above

### Service / DTO split
No split needed for the owner-edit path vs moderation — they're different fields
entirely (content vs status), already naturally separated by existing DTOs
(`UpdateCommentDto` vs `UpdateCommentStatusDto`). Just relocate the status endpoint.

### Notes / open questions
- Should staff be able to see/delete guest comments the same as logged-in-user comments?
  (Likely yes, flagging for confirmation.)

---

## Model: Newsletter (not yet implemented)

Per `CLAUDE.md`, this entity exists in the schema/roadmap but has no module yet. When
built, follow the same pattern:
- Frontend: `POST /api/f/newsletter/subscribe`, `POST /api/f/newsletter/unsubscribe` —
  public, `@OptionalAuth()`
- Backoffice: `GET /api/b/newsletter/subscribers`, moderation/export endpoints —
  `B_JwtAuthGuard` + `B_RolesGuard`

---

## Suggested execution order

1. Phase 0 (guard refactor) — nothing else should start until this lands, since every
   controller touched below needs the new guards.
2. Category — smallest, no dual-surface, good smoke test of the pattern.
3. Comment — small, one endpoint to relocate.
4. User — medium, no dual-surface, several endpoints to relocate.
5. Post — largest, the only true dual-surface (DTO split) case — do last once the
   pattern is proven on the simpler models.
