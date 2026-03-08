import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcryptjs';
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

  listResidents() {
    return this.prisma.resident.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
          },
        },
        units: {
          include: {
            building: {
              select: {
                id: true,
                name: true,
                address: true,
              },
            },
          },
          orderBy: {
            id: 'asc',
          },
        },
      },
      orderBy: {
        id: 'asc',
      },
    });
  }

  listTechnicians() {
    return this.prisma.user.findMany({
      where: {
        role: 'TECH',
      },
      select: {
        id: true,
        email: true,
        phone: true,
        supplier: {
          select: {
            id: true,
            name: true,
            skills: true,
            rating: true,
          },
        },
      },
      orderBy: {
        email: 'asc',
      },
    });
  }

  findProfile(userId: number) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        resident: {
          include: {
            units: {
              include: {
                building: true,
              },
            },
            invoices: {
              orderBy: { createdAt: 'desc' },
              take: 5,
            },
          },
        },
        supplier: true,
      },
    });
  }

  updateProfile(
    userId: number,
    data: {
      email?: string;
      phone?: string | null;
      pushToken?: string | null;
      notificationPreferences?: Record<string, boolean>;
    },
  ) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        email: data.email,
        phone: data.phone,
        pushToken: data.pushToken,
        notificationPreferences: data.notificationPreferences as any,
      },
      include: {
        resident: {
          include: {
            units: {
              include: {
                building: true,
              },
            },
          },
        },
        supplier: true,
      },
    });
  }

  async changePassword(userId: number, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const matches = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!matches) {
      throw new Error('Current password is incorrect');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    return { ok: true };
  }
}
