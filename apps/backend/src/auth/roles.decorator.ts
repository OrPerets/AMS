import { SetMetadata } from '@nestjs/common';

export enum Role {
  ADMIN = 'ADMIN',
  PM = 'PM',
  TECH = 'TECH',
  RESIDENT = 'RESIDENT',
  ACCOUNTANT = 'ACCOUNTANT',
  MASTER = 'MASTER'
}

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
