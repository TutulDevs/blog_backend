import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';

interface HttpExceptionResponseBody {
  message?: string | string[];
  error?: string;
  messages?: string[];
}

interface ErrorResponseBody {
  success: false;
  code: number;
  timestamp: string;
  path: string;
  message: string;
  messages: string[];
}

/**
 * Global error filter. Every thrown error, expected or not, is normalized
 * into one consistent response shape so clients never have to guess whether
 * `message` is a string vs an array:
 *
 *   { success, code, timestamp, path, message, messages }
 *
 * - `success` is always `false` (this filter only ever runs for errors).
 * - `message` is always a single human-readable string (the first/primary
 *   error — safe to show directly in a toast or banner).
 * - `messages` is always an array of every error string that applies. For a
 *   normal exception it's a single-element array equal to `[message]`; for a
 *   DTO validation failure it's every failed constraint across every field
 *   (see ValidationPipe's exceptionFactory in main.ts, which produces this
 *   shape).
 * - Unexpected/5xx errors (DB errors, bugs, etc.) are logged server-side via
 *   Logger, but the raw message is never sent to the client — only the
 *   generic "Internal server error" is.
 *
 * Examples:
 *
 * // throw new NotFoundException('Post not found')
 * {
 *   "success": false,
 *   "code": 404,
 *   "timestamp": "2026-07-19T10:22:00.000Z",
 *   "path": "/api/f/posts/abc",
 *   "message": "Post not found",
 *   "messages": ["Post not found"]
 * }
 *
 * // DTO validation failure (class-validator, via ValidationPipe)
 * {
 *   "success": false,
 *   "code": 400,
 *   "timestamp": "2026-07-19T10:22:00.000Z",
 *   "path": "/api/f/users",
 *   "message": "email must be an email",
 *   "messages": ["email must be an email", "username should not be empty"]
 * }
 *
 * // unhandled Prisma error (e.g. a duplicate unique-key insert in a
 * // service that has no try/catch of its own around it)
 * {
 *   "success": false,
 *   "code": 409,
 *   "timestamp": "2026-07-19T10:22:00.000Z",
 *   "path": "/api/b/staffs",
 *   "message": "email already exists",
 *   "messages": ["email already exists"]
 * }
 *
 * // unexpected error (bug, unmapped Prisma error code, etc.)
 * {
 *   "success": false,
 *   "code": 500,
 *   "timestamp": "2026-07-19T10:22:00.000Z",
 *   "path": "/api/f/posts",
 *   "message": "Internal server error",
 *   "messages": ["Internal server error"]
 * }
 */
@Catch() // if empty, catch all error (HttpException, Database Error etc)
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { status, messages } = this.resolve(exception);

    // never leak unexpected/internal errors to the client, only log them
    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        exception instanceof Error ? exception.stack : exception,
        AllExceptionsFilter.name,
      );
    }

    const body: ErrorResponseBody = {
      success: false,
      code: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: messages[0],
      messages,
    };

    response.status(status).json(body);
  }

  private resolve(exception: unknown): {
    status: number;
    messages: string[];
  } {
    if (exception instanceof HttpException) {
      return {
        status: exception.getStatus(),
        messages: this.resolveHttpExceptionMessages(exception),
      };
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const prismaError = this.resolvePrismaError(exception);
      if (prismaError) return prismaError;
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      messages: ['Internal server error'],
    };
  }

  private resolveHttpExceptionMessages(exception: HttpException): string[] {
    const res = exception.getResponse();

    if (typeof res === 'string') {
      return [res];
    }

    const body = res as HttpExceptionResponseBody;

    // flat validation errors, shaped by ValidationPipe's exceptionFactory (see main.ts)
    if (Array.isArray(body.messages) && body.messages.length > 0) {
      return body.messages;
    }

    if (Array.isArray(body.message) && body.message.length > 0) {
      return body.message;
    }

    if (typeof body.message === 'string') {
      return [body.message];
    }

    return [body.error ?? exception.message];
  }

  /**
   * Fallback for services that don't hand-roll their own try/catch around
   * Prisma errors (some do, e.g. post.service.ts / user.service.ts, to give
   * a more specific message). Without this, an unhandled unique-key or
   * foreign-key violation would otherwise surface as an opaque
   * "Internal server error" 500 instead of a proper 409/400/404.
   */
  private resolvePrismaError(
    error: Prisma.PrismaClientKnownRequestError,
  ): { status: number; messages: string[] } | null {
    const target = Array.isArray(error.meta?.target)
      ? (error.meta.target as string[]).join(', ')
      : typeof error.meta?.target === 'string'
        ? error.meta.target
        : undefined;

    switch (error.code) {
      case 'P2002':
        return {
          status: HttpStatus.CONFLICT,
          messages: [
            target ? `${target} already exists` : 'Resource already exists',
          ],
        };
      case 'P2003':
        return {
          status: HttpStatus.BAD_REQUEST,
          messages: ['Invalid reference: related record does not exist'],
        };
      case 'P2025':
        return {
          status: HttpStatus.NOT_FOUND,
          messages: ['Record not found'],
        };
      default:
        return null; // unmapped Prisma error code -> falls through to generic 500
    }
  }
}
