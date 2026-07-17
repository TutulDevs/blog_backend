import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { StaffRole } from '../../lib/coreconstants';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { isStaffUser, RequestWithStaff } from './auth-payload.types';

@Injectable()
export class B_RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithStaff>();
    const staffRole =
      request.user && isStaffUser(request.user) ? request.user.role : undefined;

    // 1. Block anyone who isn't a staff member outright
    if (staffRole === undefined) {
      throw new ForbiddenException('Access restricted to staff members only');
    }

    // 2. Look for specific role restrictions (e.g., @Roles(StaffRole.ADMIN))
    const requiredRoles = this.reflector.getAllAndOverride<StaffRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // 3. If NO specific roles are defined, allow ANY active staff member through
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // 4. If specific roles ARE defined, ensure the staff member matches one of them
    if (!requiredRoles.includes(staffRole)) {
      throw new ForbiddenException(
        'You do not have permission to access this resource',
      );
    }

    return true;
  }
}
