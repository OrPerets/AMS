import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { NotificationService } from '../notifications/notification.service';

@Injectable()
export class SupportService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationService,
  ) {}

  async submit(body: {
    name: string;
    email: string;
    subject: string;
    message: string;
    category?: string;
    urgency?: string;
  }) {
    const admins = await this.prisma.user.findMany({
      where: {
        role: {
          in: ['ADMIN', 'PM'],
        },
      },
      select: { id: true, tenantId: true },
    });

    const title = `Support: ${body.subject}`;
    const message = [
      `Name: ${body.name}`,
      `Email: ${body.email}`,
      body.category ? `Category: ${body.category}` : null,
      body.urgency ? `Urgency: ${body.urgency}` : null,
      '',
      body.message,
    ]
      .filter(Boolean)
      .join('\n');

    await Promise.all(
      admins.map((admin) =>
        this.notifications.create({
          title,
          message,
          type: 'SUPPORT_REQUEST',
          userId: admin.id,
          tenantId: admin.tenantId,
          metadata: {
            email: body.email,
            category: body.category,
            urgency: body.urgency,
          },
        }),
      ),
    );

    return {
      ok: true,
      recipients: admins.length,
    };
  }
}
