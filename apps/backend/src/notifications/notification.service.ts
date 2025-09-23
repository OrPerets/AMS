import { Injectable } from '@nestjs/common';
import { Ticket, User } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import sgMail from '@sendgrid/mail';
import twilio from 'twilio';
import { CreateNotificationDto } from './dto/create-notification.dto';

if (process.env.SENDGRID_API_KEY && process.env.SENDGRID_API_KEY.startsWith('SG.')) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
} else {
  console.warn('SENDGRID_API_KEY not set or invalid; email sending disabled.');
}
const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

export enum NotificationTemplate {
  TICKET_STATUS = 'TICKET_STATUS',
  ANNOUNCEMENT = 'ANNOUNCEMENT',
}

type TemplateParams = Record<string, string>;

const templates: Record<NotificationTemplate, { subject: string; body: string }> = {
  [NotificationTemplate.TICKET_STATUS]: {
    subject: 'Ticket {{id}} status: {{status}}',
    body: 'Ticket {{id}} is now {{status}}.',
  },
  [NotificationTemplate.ANNOUNCEMENT]: {
    subject: '{{title}}',
    body: '{{message}}',
  },
};

@Injectable()
export class NotificationService {
  constructor(private prisma: PrismaService) {}

  private render(template: NotificationTemplate, params: TemplateParams) {
    const t = templates[template];
    let subject = t.subject;
    let body = t.body;
    for (const key of Object.keys(params)) {
      const value = params[key];
      subject = subject.replace(new RegExp(`{{${key}}}`, 'g'), value);
      body = body.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }
    return { subject, body };
  }

  private async send(user: User & { phone?: string | null; pushToken?: string | null }, subject: string, body: string) {
    if (user.email) {
      if (process.env.SENDGRID_API_KEY) {
        await sgMail.send({
          to: user.email,
          from: process.env.SENDGRID_FROM_EMAIL || 'noreply@example.com',
          subject,
          text: body,
        });
      } else {
        console.log(`Email to ${user.email}: ${subject} - ${body}`);
      }
    }
    if (user.phone) {
      if (twilioClient && process.env.TWILIO_FROM_NUMBER) {
        await twilioClient.messages.create({
          from: process.env.TWILIO_FROM_NUMBER,
          to: user.phone,
          body,
        });
      } else {
        console.log(`SMS to ${user.phone}: ${body}`);
      }
    }
    if (user.pushToken) {
      console.log(`Push to ${user.pushToken}: ${subject} - ${body}`);
    }
  }

  private async logNotification(data: {
    title: string;
    message: string;
    type?: string;
    tenantId?: number;
    userId?: number;
    buildingId?: number;
    metadata?: Record<string, any>;
  }) {
    return this.prisma.notification.create({
      data: {
        ...data,
        metadata: data.metadata ? (data.metadata as any) : undefined,
      },
    });
  }

  async create(dto: CreateNotificationDto) {
    return this.logNotification(dto);
  }

  async notifyUser(userId: number, template: NotificationTemplate, params: TemplateParams) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user) {
      const { subject, body } = this.render(template, params);
      await this.send(user as any, subject, body);
      await this.logNotification({
        title: subject,
        message: body,
        type: template,
        tenantId: user.tenantId,
        userId: user.id,
        metadata: params,
      });
    }
  }

  async notifyBuilding(buildingId: number, template: NotificationTemplate, params: TemplateParams) {
    const [users, building] = await Promise.all([
      this.prisma.user.findMany({
        where: { resident: { units: { some: { buildingId } } } },
      }),
      this.prisma.building.findUnique({ where: { id: buildingId } }),
    ]);
    const { subject, body } = this.render(template, params);
    await Promise.all(
      users.map((u) =>
        Promise.all([
          this.send(u as any, subject, body),
          this.logNotification({
            title: subject,
            message: body,
            type: template,
            tenantId: u.tenantId,
            userId: u.id,
            buildingId,
            metadata: params,
          }),
        ]),
      ),
    );

    if (users.length === 0) {
      await this.logNotification({
        title: subject,
        message: body,
        type: template,
        tenantId: building?.tenantId,
        buildingId,
        metadata: params,
      });
    }
  }

  async notifyAllTenants(template: NotificationTemplate, params: TemplateParams) {
    const users = await this.prisma.user.findMany();
    const { subject, body } = this.render(template, params);
    await Promise.all(
      users.map((u) =>
        Promise.all([
          this.send(u as any, subject, body),
          this.logNotification({
            title: subject,
            message: body,
            type: template,
            tenantId: u.tenantId,
            userId: u.id,
            metadata: params,
          }),
        ]),
      ),
    );
  }

  async ticketStatusChanged(ticket: Ticket): Promise<void> {
    const unit = await this.prisma.unit.findUnique({
      where: { id: ticket.unitId },
      include: { residents: { include: { user: true } } },
    });
    const users = unit?.residents.map((r) => r.user) || [];
    const { subject, body } = this.render(NotificationTemplate.TICKET_STATUS, {
      id: ticket.id.toString(),
      status: ticket.status,
    });
    await Promise.all(
      users.map((u) =>
        Promise.all([
          this.send(u as any, subject, body),
          this.logNotification({
            title: subject,
            message: body,
            type: NotificationTemplate.TICKET_STATUS,
            tenantId: u.tenantId,
            userId: u.id,
            buildingId: unit?.buildingId,
            metadata: { ticketId: ticket.id, status: ticket.status },
          }),
        ]),
      ),
    );
  }

  getUserNotifications(userId: number) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  getBuildingNotifications(buildingId: number) {
    return this.prisma.notification.findMany({
      where: { buildingId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markAsRead(id: number) {
    return this.prisma.notification.update({
      where: { id },
      data: { read: true, readAt: new Date() },
    });
  }
}

