import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { IS_OPTIONAL_AUTH_KEY } from '../decorators/optional-auth.decorator';

export interface AuthenticatedUser {
  id: number;
  email: string;
  role: number;
}

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
      const value = await this.jwtService.verifyAsync(token);
      // STAFF { id: 1, email: 'admin@email.com', role: 1, iat: 1784115890, exp: 1784116190 }
      // USER { id: 1, username: 'k_007', status: 1, iat: 1784115890, exp: 1784116190 }
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
