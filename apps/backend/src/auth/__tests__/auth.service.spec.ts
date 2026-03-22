import { AuthService } from '../auth.service';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../../users/user.service';
import * as bcrypt from 'bcryptjs';

describe('AuthService', () => {
  const userService: Partial<UserService> = {
    findByEmail: jest.fn(async (email: string) => {
      if (email === 'test@example.com') {
        return {
          id: 1,
          email,
          passwordHash: await bcrypt.hash('password', 10),
          tenantId: 1,
          role: 'RESIDENT',
        } as any;
      }
      return null;
    }) as any,
  };
  const jwtService = new JwtService({ secret: 'test' });
  const service = new AuthService(userService as UserService, jwtService);

  it('validates user credentials', async () => {
    const user = await service.validateUser('test@example.com', 'password');
    expect(user.email).toBe('test@example.com');
  });

  it('throws on invalid credentials', async () => {
    await expect(service.validateUser('test@example.com', 'wrong')).rejects.toBeDefined();
  });

  it('preserves impersonation claims when issuing tokens', async () => {
    const tokens = await service.login({
      sub: 8,
      email: 'resident@demo.com',
      role: 'MASTER',
      tenantId: 1,
      actAsRole: 'RESIDENT',
      originalSub: 1,
      originalEmail: 'master@demo.com',
      originalTenantId: 1,
    });

    const payload = jwtService.decode(tokens.accessToken) as Record<string, any>;
    expect(payload.sub).toBe(8);
    expect(payload.actAsRole).toBe('RESIDENT');
    expect(payload.originalSub).toBe(1);
    expect(payload.originalEmail).toBe('master@demo.com');
  });
});
