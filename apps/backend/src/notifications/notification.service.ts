import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { Ticket, User } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import sgMail from '@sendgrid/mail';
import twilio from 'twilio';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { WebSocketGateway } from '../websocket/websocket.gateway';

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
  MAINTENANCE_REMINDER = 'MAINTENANCE_REMINDER',
  PAYMENT_DUE = 'PAYMENT_DUE',
  PAYMENT_OVERDUE = 'PAYMENT_OVERDUE',
  WORK_ORDER_ASSIGNED = 'WORK_ORDER_ASSIGNED',
  WORK_ORDER_COMPLETED = 'WORK_ORDER_COMPLETED',
  BUDGET_ALERT = 'BUDGET_ALERT',
  EMERGENCY_ALERT = 'EMERGENCY_ALERT',
  MEETING_REMINDER = 'MEETING_REMINDER',
  INSPECTION_SCHEDULED = 'INSPECTION_SCHEDULED',
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
  [NotificationTemplate.MAINTENANCE_REMINDER]: {
    subject: 'תזכורת תחזוקה: {{title}}',
    body: 'תזכורת: {{description}} מתוכננת ל-{{date}} ב-{{time}}.',
  },
  [NotificationTemplate.PAYMENT_DUE]: {
    subject: 'תשלום בגין {{type}} - תזכורת',
    body: 'חוב בסך {{amount}} ש"ח בגין {{type}} יפוג ב-{{dueDate}}. אנא השלם את התשלום בהקדם.',
  },
  [NotificationTemplate.PAYMENT_OVERDUE]: {
    subject: 'תשלום בפיגור - {{type}}',
    body: 'חוב בסך {{amount}} ש"ח בגין {{type}} בפיגור מאז {{dueDate}}. אנא השלם מיד.',
  },
  [NotificationTemplate.WORK_ORDER_ASSIGNED]: {
    subject: 'הזמנת עבודה חדשה: {{title}}',
    body: 'הוקצתה לך הזמנת עבודה חדשה: {{description}}. תאריך יעד: {{dueDate}}.',
  },
  [NotificationTemplate.WORK_ORDER_COMPLETED]: {
    subject: 'הזמנת עבודה הושלמה: {{title}}',
    body: 'הזמנת עבודה {{title}} הושלמה בהצלחה על ידי {{completedBy}}.',
  },
  [NotificationTemplate.BUDGET_ALERT]: {
    subject: 'התראת תקציב: {{budgetName}}',
    body: 'התקציב {{budgetName}} הגיע ל-{{percentage}}% ניצול ({{used}}/{{total}} ש"ח).',
  },
  [NotificationTemplate.EMERGENCY_ALERT]: {
    subject: 'התראה דחופה: {{title}}',
    body: 'התראה דחופה: {{message}} בבניין {{buildingName}}. אנא פעל מיד.',
  },
  [NotificationTemplate.MEETING_REMINDER]: {
    subject: 'תזכורת פגישה: {{title}}',
    body: 'פגישה "{{title}}" מתוכננת ל-{{date}} ב-{{time}} ב-{{location}}.',
  },
  [NotificationTemplate.INSPECTION_SCHEDULED]: {
    subject: 'בדיקה מתוכננת: {{type}}',
    body: 'בדיקת {{type}} מתוכננת ל-{{date}} ב-{{time}} בבניין {{buildingName}}.',
  },
};

@Injectable()
export class NotificationService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => WebSocketGateway))
    private websocketGateway: WebSocketGateway,
  ) {}

  // Real-time notification broadcasting
  private notificationSubscribers = new Map<number, Set<(notification: any) => void>>();

  subscribeToNotifications(userId: number, callback: (notification: any) => void) {
    if (!this.notificationSubscribers.has(userId)) {
      this.notificationSubscribers.set(userId, new Set());
    }
    this.notificationSubscribers.get(userId)!.add(callback);
    
    // Return unsubscribe function
    return () => {
      const userSubscribers = this.notificationSubscribers.get(userId);
      if (userSubscribers) {
        userSubscribers.delete(callback);
        if (userSubscribers.size === 0) {
          this.notificationSubscribers.delete(userId);
        }
      }
    };
  }

  private broadcastNotification(userId: number, notification: any) {
    const subscribers = this.notificationSubscribers.get(userId);
    if (subscribers) {
      subscribers.forEach(callback => callback(notification));
    }
  }

  // Get user notification preferences
  async getUserNotificationPreferences(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { 
        email: true, 
        phone: true, 
        pushToken: true,
        notificationPreferences: true 
      }
    });
    
    if (!user) return null;

    // Default preferences if not set
    const defaultPreferences = {
      email: true,
      sms: true,
      push: true,
      ticketUpdates: true,
      maintenanceReminders: true,
      paymentReminders: true,
      announcements: true,
      emergencyAlerts: true,
      workOrderUpdates: true,
      general: true,
    };

    return {
      ...defaultPreferences,
      ...(user.notificationPreferences as any),
    };
  }

  // Update user notification preferences
  async updateNotificationPreferences(userId: number, preferences: any) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { notificationPreferences: preferences }
    });
  }

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

  private async send(
    user: User & { phone?: string | null; pushToken?: string | null; notificationPreferences?: any },
    subject: string, 
    body: string,
    notificationType?: string
  ) {
    const preferences = await this.getUserNotificationPreferences(user.id);
    
    // Check if user wants to receive this type of notification
    if (notificationType && preferences) {
      const typeKey = this.getPreferenceKey(notificationType);
      if (preferences[typeKey] === false) {
        return; // User has disabled this notification type
      }
    }

    // Send email if enabled
    if (user.email && preferences?.email !== false) {
      if (process.env.SENDGRID_API_KEY) {
        try {
          await sgMail.send({
            to: user.email,
            from: process.env.SENDGRID_FROM_EMAIL || 'noreply@example.com',
            subject,
            text: body,
          });
        } catch (error) {
          console.error(`Failed to send email to ${user.email}:`, error);
        }
      } else {
        console.log(`Email to ${user.email}: ${subject} - ${body}`);
      }
    }

    // Send SMS if enabled
    if (user.phone && preferences?.sms !== false) {
      if (twilioClient && process.env.TWILIO_FROM_NUMBER) {
        try {
          await twilioClient.messages.create({
            from: process.env.TWILIO_FROM_NUMBER,
            to: user.phone,
            body,
          });
        } catch (error) {
          console.error(`Failed to send SMS to ${user.phone}:`, error);
        }
      } else {
        console.log(`SMS to ${user.phone}: ${body}`);
      }
    }

    // Send push notification if enabled
    if (user.pushToken && preferences?.push !== false) {
      // TODO: Implement actual push notification service
      console.log(`Push to ${user.pushToken}: ${subject} - ${body}`);
    }
  }

  private getPreferenceKey(notificationType: string): string {
    const typeMap: Record<string, string> = {
      'TICKET_STATUS': 'ticketUpdates',
      'MAINTENANCE_REMINDER': 'maintenanceReminders',
      'PAYMENT_DUE': 'paymentReminders',
      'PAYMENT_OVERDUE': 'paymentReminders',
      'ANNOUNCEMENT': 'announcements',
      'EMERGENCY_ALERT': 'emergencyAlerts',
      'WORK_ORDER_ASSIGNED': 'workOrderUpdates',
      'WORK_ORDER_COMPLETED': 'workOrderUpdates',
    };
    return typeMap[notificationType] || 'general';
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
    const notification = await this.prisma.notification.create({
      data: {
        ...data,
        metadata: data.metadata ? (data.metadata as any) : undefined,
      },
    });

    // Broadcast to real-time subscribers (in-memory)
    if (data.userId) {
      this.broadcastNotification(data.userId, notification);
    }

    // Broadcast via WebSocket to connected clients
    if (data.userId) {
      this.websocketGateway.notifyNewNotification(notification, data.userId);
    }

    return notification;
  }

  async create(dto: CreateNotificationDto) {
    return this.logNotification(dto);
  }

  async notifyUser(userId: number, template: NotificationTemplate, params: TemplateParams) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user) {
      const { subject, body } = this.render(template, params);
      await this.send(user as any, subject, body, template);
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
          this.send(u as any, subject, body, template),
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
