import { AuthService } from '../auth.service';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../../users/user.service';
import * as bcrypt from 'bcrypt';

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
});
