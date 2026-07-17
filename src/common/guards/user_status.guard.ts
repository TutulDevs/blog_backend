import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserStatus } from '../../lib/coreconstants';
import { isStaffUser } from './auth-payload.types';
import { USER_STATUS_KEY } from '../decorators/user_status.decorator';

@Injectable()
export class UserStatusGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // 1. Safety net: If it's a staff user or not logged in, pass it down
    // (F_JwtAuthGuard already blocks staff on /api/f, and handles optional auth)
    if (!user || isStaffUser(user)) {
      return true;
    }

    // 2. Check explicitly if the user has been banned or suspended
    if (user.status === UserStatus.BANNED) {
      throw new ForbiddenException('Your account has been permanently banned.');
    }
    if (user.status === UserStatus.SUSPENDED) {
      throw new ForbiddenException('Your account is temporarily suspended.');
    }

    // 3. Look for specific route status overrides
    const allowedStatuses = this.reflector.getAllAndOverride<UserStatus[]>(
      USER_STATUS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // 4. Default behavior: If no decorator is present, require the user to be ACTIVE
    if (!allowedStatuses || allowedStatuses.length === 0) {
      if (user.status !== UserStatus.ACTIVE) {
        throw new ForbiddenException(
          'Your account must be active to perform this action.',
        );
      }
      return true;
    }

    // 5. If specific statuses are allowed, check if the user matches one of them
    if (!allowedStatuses.includes(user.status)) {
      throw new ForbiddenException(
        'You do not have permission to access this resource.',
      );
    }

    return true;
  }
}

// usages
/*
1. Any basic route is instantly locked down to ACTIVE users only. 
   If a user is PENDING_VERIFICATION or INACTIVE, they are automatically kicked out.
@FrontendController('cart')
@UseGuards(F_JwtAuthGuard, UserStatusGuard)
export class CartController {
  @Get() // Only ACTIVE users can access this
  getCart() {
    return this.cartService.get();
  }
}

2. Use the @AllowedUserStatuses decorator to allow users who aren't fully active yet to hit specific endpoints (like viewing their profile setup or triggering a verification SMS).

@FrontendController('profile')
@UseGuards(F_JwtAuthGuard, UserStatusGuard)
export class ProfileController {
  
  @Post('resend-verification')
  @AllowedUserStatuses(UserStatus.PENDING_VERIFICATION, UserStatus.ACTIVE)
  resendEmail() {
    // Both pending and active users can reach this
    return this.authService.resendVerification();
  }
}

*/
