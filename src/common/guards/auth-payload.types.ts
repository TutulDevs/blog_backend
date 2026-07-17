import { Request } from 'express';

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
