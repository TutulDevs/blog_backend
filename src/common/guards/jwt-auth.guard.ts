import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

export interface AuthenticatedStaff {
  id: number;
  email: string;
  role: number;
}

export interface RequestWithStaff extends Request {
  user: AuthenticatedStaff;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithStaff>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Not logged in');
    }

    try {
      const value = await this.jwtService.verifyAsync(token);
      // { id: 1, email: 'admin@email.com', role: 1, iat: 1784115890, exp: 1784116190 }
      request.user = value;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
