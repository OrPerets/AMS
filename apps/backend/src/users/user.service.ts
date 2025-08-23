import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
// Prisma types are generated in runtime; keep signatures lightweight to avoid tight coupling

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  create(data: { email: string; passwordHash: string; role: any; tenantId: number }) {
    return this.prisma.user.create({ data });
  }

  findAll() {
    return this.prisma.user.findMany();
  }
}
