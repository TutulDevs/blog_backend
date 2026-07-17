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

export interface StaffJwtPayload {
  id: number;
  email: string;
  role: number;
}

export interface UserJwtPayload {
  id: number;
  username: string;
  status: number;
}

export type AuthenticatedUser = StaffJwtPayload | UserJwtPayload;

export const isStaffUser = (user: AuthenticatedUser): user is StaffJwtPayload =>
  'role' in user;

export interface RequestWithStaff extends Request {
  user: AuthenticatedUser;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
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

    // console.log('jwt_g:', request.originalUrl, isOptionalAuth);

    if (!token) {
      if (isOptionalAuth) return true; // pass if optional
      throw new UnauthorizedException('Not logged in');
    }

    try {
      const value = await this.jwtService.verifyAsync<AuthenticatedUser>(token);
      request.user = value;
    } catch {
      if (isOptionalAuth) return true; // pass if optional
      throw new UnauthorizedException('Invalid or expired token');
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
