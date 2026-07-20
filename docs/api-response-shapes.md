# API Response Shapes

Every response from this API — success or error — is wrapped in a consistent envelope by global infrastructure (`AllExceptionsFilter` for errors, `TransformResponseInterceptor` for success), not per-endpoint. These are the TypeScript types for the admin frontend (or any other client) to model both shapes.

```ts
export interface SuccessResponse<T = unknown> {
  success: true;
  code: number;
  timestamp: string;
  path: string;
  message: string;
  data: T;
}

export interface ErrorResponse {
  success: false;
  code: number;
  timestamp: string;
  path: string;
  message: string;
  messages: string[];
}

export type ApiResponse<T = unknown> = SuccessResponse<T> | ErrorResponse;
```

`success` is a discriminant — narrow on it and TypeScript resolves the rest of the shape automatically:

```ts
function handle<T>(res: ApiResponse<T>) {
  if (res.success) {
    // res.data: T, res.message e.g. "Post created successfully"
  } else {
    // res.message: primary error, res.messages: every validation error (if any)
  }
}
```

## Field notes

- **`code`** — HTTP status code, duplicated from the response status for convenience when the caller only has the JSON body (e.g. inside a generic response interceptor).
- **`timestamp`** — ISO 8601, when the server produced the response.
- **`path`** — the request URL that produced this response, useful for correlating errors with logs or disambiguating which of several in-flight requests failed.
- **`message`** — always a single human-readable string, safe to show directly in a toast/banner.
  - On success, mutation endpoints return the service's own message (e.g. `"Post deleted successfully"`); GET/list endpoints that don't produce one fall back to a fixed `"Fetched successfully"` — never guessed per HTTP method.
  - On error, it's the first/primary error message.
- **`messages`** (error only) — every applicable error string. For a normal exception it's a single-element array equal to `[message]`; for a DTO validation failure (`class-validator`, via `ValidationPipe`) it's every failed constraint across every field on the request body.
- **`data`** (success only) — the actual payload, shape varies per endpoint:
  - Page-based list endpoints (users, posts, categories, staff): `{ meta: { totalCount, page, limit, totalPages }, list: [...] }`
  - Cursor-based list endpoints (comments and replies, both `/api/f/*` and `/api/b/*`): `{ meta: { totalCount, limit, cursor, nextCursor, hasNextPage }, list: [...] }` — see "Cursor pagination" below.
  - Single resource: `{ post }` / `{ user }` / `{ category }` / `{ comment }` / `{ staff }`
  - Most mutations (status/role/verify updates, create/delete on staff/category/user/comment): `{}` — the service now only returns a `message`, no resource payload
  - Frontend post mutations (create/update/slug/cover-image) are the exception and still include the resource: `{ post }`
  - Login: `{ accessToken, user }` / `{ accessToken, staff }`

There's no single fixed shape for `data` beyond "whatever that specific service returns" — type it per-endpoint on the client side rather than trying to generalize further.

## Cursor pagination

Comment-listing endpoints (`GET /api/f/posts/:id/comments`, `GET /api/f/comments/:parentId/replies`, `GET /api/b/comments`, `GET /api/b/comments/:parentId/replies`) use cursor pagination instead of page/limit, since comment lists are appended-to concurrently and page numbers shift under that. Request query params are `cursor` (optional, the last-seen comment/reply `id`) and `limit` (optional, default 5 on the frontend / 10 on the backoffice, minimum 1).

```ts
export interface CursorMeta {
  totalCount: number;
  limit: number;
  cursor: number | null;
  nextCursor: number | null;
  hasNextPage: boolean;
}
```

- **`totalCount`** — total rows matching the filter, independent of pagination (all approved top-level comments on the post, for example — not just the current page).
- **`cursor`** — the cursor that was passed in the request (`null` if this was the first page).
- **`nextCursor`** — the `id` to pass as `cursor` on the next request; `null` when `hasNextPage` is `false`.
- **`hasNextPage`** — whether another page exists. There is no `hasPreviousPage` — these are forward-only, infinite-scroll-style feeds, not jump-to-page navigation.

To fetch the next page, pass `nextCursor` back as the `cursor` query param; stop paging once `hasNextPage` is `false`.

## Examples

```json
// GET /api/f/posts
{
  "success": true,
  "code": 200,
  "timestamp": "2026-07-20T10:22:00.000Z",
  "path": "/api/f/posts",
  "message": "Fetched successfully",
  "data": { "meta": { "totalCount": 42, "page": 1, "limit": 10, "totalPages": 5 }, "list": [] }
}
```

```json
// GET /api/f/posts/42/comments
{
  "success": true,
  "code": 200,
  "timestamp": "2026-07-20T10:22:00.000Z",
  "path": "/api/f/posts/42/comments",
  "message": "Fetched successfully",
  "data": {
    "meta": { "totalCount": 23, "limit": 5, "cursor": null, "nextCursor": 18, "hasNextPage": true },
    "list": []
  }
}
```

```json
// PATCH /api/b/staffs/1/status
{
  "success": true,
  "code": 200,
  "timestamp": "2026-07-20T10:22:00.000Z",
  "path": "/api/b/staffs/1/status",
  "message": "Staff status updated successfully",
  "data": {}
}
```

```json
// PATCH /api/f/users/me with an invalid email
{
  "success": false,
  "code": 400,
  "timestamp": "2026-07-20T10:22:00.000Z",
  "path": "/api/f/users/me",
  "message": "email must be an email",
  "messages": ["email must be an email"]
}
```

```json
// PATCH /api/b/staffs/1/status with an out-of-range status
{
  "success": false,
  "code": 400,
  "timestamp": "2026-07-20T10:22:00.000Z",
  "path": "/api/b/staffs/1/status",
  "message": "Invalid status",
  "messages": ["Invalid status"]
}
```

## Source

- Error envelope: `src/common/filters/all_exceptions.filter.ts`
- Success envelope: `src/common/interceptors/transform_response.interceptor.ts`
- Both are registered globally in `src/main.ts` (`app.useGlobalFilters(...)` / `app.useGlobalInterceptors(...)`), so every route gets one of these two shapes with no per-controller opt-in required.
