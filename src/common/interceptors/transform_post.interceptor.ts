import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class TransformPostInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // will execute before the route handler
    // console.log('before execute:', context.getHandler());

    return next.handle().pipe(
      // 'data' will have the returned response from the route handler
      map((data) => ({
        code: context.switchToHttp().getResponse().statusCode,
        data: data,
        timestamp: new Date().toISOString(),
      })),
    );
  }
}
