import { SetMetadata } from '@nestjs/common';

export type AppRole = 'user' | 'ngo' | 'govt' | 'volunteer' | 'group';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: AppRole[]) => SetMetadata(ROLES_KEY, roles);
