import { RolesGuard } from '../roles.guard';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ExecutionContext } from '@nestjs/common';

describe('RolesGuard', () => {
  function setup(user: any, required: Role[]) {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(required),
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);
    const context = {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
    } as unknown as ExecutionContext;
    return { guard, context };
  }

  it('allows user with matching role', () => {
    const { guard, context } = setup({ role: Role.ADMIN }, [Role.ADMIN]);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('allows master acting as role', () => {
    const { guard, context } = setup({ role: Role.MASTER, actAsRole: Role.ADMIN }, [Role.ADMIN]);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('denies when actAsRole mismatch', () => {
    const { guard, context } = setup({ role: Role.MASTER, actAsRole: Role.TECH }, [Role.ADMIN]);
    expect(guard.canActivate(context)).toBe(false);
  });
});
