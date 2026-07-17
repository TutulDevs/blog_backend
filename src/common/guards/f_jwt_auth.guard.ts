import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { IS_OPTIONAL_AUTH_KEY } from '../decorators/optional_auth.decorator';
import {
  AuthenticatedUser,
  isStaffUser,
  RequestWithStaff,
} from './auth-payload.types';

// Frontend guard: only accepts a User-shaped JWT payload (blog writers/readers).
@Injectable()
export class F_JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isOptionalAuth = this.reflector.getAllAndOverride<boolean>(
      IS_OPTIONAL_AUTH_KEY,
      [context.getHandler(), context.getClass()],
    );

    const request = context.switchToHttp().getRequest<RequestWithStaff>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      if (isOptionalAuth) return true;
      throw new UnauthorizedException('Not logged in');
    }

    try {
      const payload =
        await this.jwtService.verifyAsync<AuthenticatedUser>(token);

      if (isStaffUser(payload)) {
        throw new UnauthorizedException('Invalid token for client application');
      }

      request.user = payload;
    } catch (error) {
      if (isOptionalAuth) return true;

      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException('Invalid or expired token');
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
