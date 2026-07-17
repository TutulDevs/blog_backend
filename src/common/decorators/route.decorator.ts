import { Controller } from '@nestjs/common';

// Backoffice prefix
export function BackofficeController(prefix: string = '') {
  // Cleans up slashes. E.g., 'staff' becomes 'b/staff'
  const routePath = `b/${prefix}`.replace(/\/$/, '');
  return Controller(routePath);
}

// Frontend prefix
export function FrontendController(prefix: string = '') {
  const routePath = `f/${prefix}`.replace(/\/$/, '');
  return Controller(routePath);
}
