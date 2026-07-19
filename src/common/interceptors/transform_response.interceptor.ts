import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request, Response } from 'express';

const DEFAULT_SUCCESS_MESSAGE = 'Fetched successfully';

export interface SuccessResponseBody<T> {
  success: true;
  code: number;
  timestamp: string;
  path: string;
  message: string;
  data: T;
}

/**
 * Global success-response wrapper — the mirror image of AllExceptionsFilter
 * on the error side. Every 2xx response gets normalized into:
 *
 *   { success, code, timestamp, path, message, data }
 *
 * - `message` is pulled from the handler's own `{ message, ...rest }` return
 *   value when present (services already return one for every mutation —
 *   e.g. "Post deleted successfully" — see the individual services). `data`
 *   is `rest`, i.e. the same payload minus the `message` key, so it's never
 *   duplicated between the two.
 * - Handlers that don't return a `message` (mainly GETs — list/search/detail
 *   endpoints) fall back to a fixed "Fetched successfully"; nothing here
 *   guesses a message from the HTTP method.
 *
 * Examples:
 *
 * // GET /api/f/posts -> service returns { meta, list }
 * {
 *   "success": true,
 *   "code": 200,
 *   "timestamp": "2026-07-20T10:22:00.000Z",
 *   "path": "/api/f/posts",
 *   "message": "Fetched successfully",
 *   "data": { "meta": { "totalCount": 42, "page": 1, "limit": 10, "totalPages": 5 }, "list": [] }
 * }
 *
 * // DELETE /api/b/posts/1 -> service returns { message: 'Post deleted successfully' }
 * {
 *   "success": true,
 *   "code": 200,
 *   "timestamp": "2026-07-20T10:22:00.000Z",
 *   "path": "/api/b/posts/1",
 *   "message": "Post deleted successfully",
 *   "data": {}
 * }
 *
 * // POST /api/f/posts -> service returns { message: 'Post created successfully', post }
 * {
 *   "success": true,
 *   "code": 201,
 *   "timestamp": "2026-07-20T10:22:00.000Z",
 *   "path": "/api/f/posts",
 *   "message": "Post created successfully",
 *   "data": { "post": { "id": 1, "title": "..." } }
 * }
 */
@Injectable()
export class TransformResponseInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<SuccessResponseBody<unknown>> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    return next.handle().pipe(
      map((result: unknown) => {
        const { message, data } = this.splitMessage(result);

        return {
          success: true,
          code: response.statusCode,
          timestamp: new Date().toISOString(),
          path: request.url,
          message,
          data,
        };
      }),
    );
  }

  private splitMessage(result: unknown): {
    message: string;
    data: unknown;
  } {
    if (
      result &&
      typeof result === 'object' &&
      typeof (result as Record<string, unknown>).message === 'string'
    ) {
      const { message, ...data } = result as { message: string } & Record<
        string,
        unknown
      >;
      return { message, data };
    }

    return { message: DEFAULT_SUCCESS_MESSAGE, data: result };
  }
}
