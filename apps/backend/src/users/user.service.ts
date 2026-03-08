import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcryptjs';
import { ActivityService } from '../activity/activity.service';
// Prisma types are generated in runtime; keep signatures lightweight to avoid tight coupling

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private activity: ActivityService,
  ) {}

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

  listManagementUsers() {
    return this.prisma.user.findMany({
      where: {
        role: {
          in: ['ADMIN', 'PM', 'ACCOUNTANT', 'MASTER'],
        },
      },
      select: {
        id: true,
        email: true,
        role: true,
        phone: true,
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

  async getAccountContext(userId: number) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
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
      },
    });

    const residentId = user.resident?.id ?? null;
    const unitIds = user.resident?.units.map((unit) => unit.id) ?? [];
    const buildingIds = user.resident?.units.map((unit) => unit.buildingId) ?? [];

    const [notifications, documents, tickets, activity] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 12,
      }),
      this.prisma.document.findMany({
        where: {
          OR: [
            { buildingId: { in: buildingIds }, accessLevel: 'PUBLIC' },
            { unitId: { in: unitIds } },
            { sharedWith: { some: { userId } } },
          ],
        },
        orderBy: { uploadedAt: 'desc' },
        take: 12,
      }),
      this.prisma.ticket.findMany({
        where: { unitId: { in: unitIds } },
        include: {
          unit: { include: { building: true } },
          comments: true,
          workOrders: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 12,
      }),
      residentId ? this.activity.list({ residentId, limit: 20 }) : Promise.resolve([]),
    ]);

    return {
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
      residentId,
      units: user.resident?.units ?? [],
      notifications,
      documents,
      tickets,
      recentActivity: activity,
    };
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
