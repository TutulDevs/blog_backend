import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch() // if empty, catch all error (HttpException, Database Error etc)
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    if (!(exception instanceof HttpException)) {
      console.log('EXCEPTION_FILTER:', exception);
    }

    // status code through error type
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    // custom formatted error
    response.status(status).json({
      code: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      error:
        // @ts-expect-error temp
        typeof message == 'string' || !message?.message
          ? message
          : // @ts-expect-error temp
            message?.message,
    });
  }
}
