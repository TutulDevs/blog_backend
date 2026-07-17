import { SetMetadata } from '@nestjs/common';
import { UserStatus } from '../../lib/coreconstants';

export const USER_STATUS_KEY = 'allowed_statuses';
export const AllowedUserStatuses = (...statuses: UserStatus[]) =>
  SetMetadata(USER_STATUS_KEY, statuses);
