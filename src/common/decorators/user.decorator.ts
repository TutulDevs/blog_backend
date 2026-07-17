import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestWithStaff } from '../guards/jwt_auth.guard';

export const UserEntity = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const req = <RequestWithStaff>ctx.switchToHttp().getRequest();
    return req.user;
  },
);
