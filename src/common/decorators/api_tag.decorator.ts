import { ApiTags } from '@nestjs/swagger';

// Backoffice prefix
export function BackofficeApiTags(prefix: string = '') {
  // Cleans up slashes. E.g., 'staff' becomes 'b/staff'
  const tag = `[B] ${prefix}`.replace(/\/$/, '');
  return ApiTags(tag);
}

// Frontend prefix
export function FrontendApiTags(prefix: string = '') {
  const tag = `[F] ${prefix}`.replace(/\/$/, '');
  return ApiTags(tag);
}
