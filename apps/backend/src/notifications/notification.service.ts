import { Injectable } from '@nestjs/common';
import { Ticket, User } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import sgMail from '@sendgrid/mail';
import twilio from 'twilio';

sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');
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

  async notifyUser(userId: number, template: NotificationTemplate, params: TemplateParams) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user) {
      const { subject, body } = this.render(template, params);
      await this.send(user as any, subject, body);
    }
  }

  async notifyBuilding(buildingId: number, template: NotificationTemplate, params: TemplateParams) {
    const users = await this.prisma.user.findMany({
      where: { resident: { units: { some: { buildingId } } } },
    });
    const { subject, body } = this.render(template, params);
    await Promise.all(users.map((u) => this.send(u as any, subject, body)));
  }

  async notifyAllTenants(template: NotificationTemplate, params: TemplateParams) {
    const users = await this.prisma.user.findMany();
    const { subject, body } = this.render(template, params);
    await Promise.all(users.map((u) => this.send(u as any, subject, body)));
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
    await Promise.all(users.map((u) => this.send(u as any, subject, body)));
  }
}

