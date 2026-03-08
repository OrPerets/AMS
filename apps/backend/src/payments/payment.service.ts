import { BadRequestException, ForbiddenException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import {
  ActivitySeverity,
  ApprovalTaskType,
  CollectionStatus,
  InvoiceReminderState,
  InvoiceStatus,
  PaymentIntentStatus,
  Prisma,
} from '@prisma/client';
import { ActivityService } from '../activity/activity.service';
import { PrismaService } from '../prisma.service';
import { ReceiptService } from './receipt.service';
import { TranzilaProvider } from './tranzila.provider';
import { StripeProvider } from './providers/stripe.provider';
import { PaymentRoutingStrategy } from './providers/payment-routing.strategy';
import { PaymentProvider, RoutingContext } from './providers/payment-provider';
import { ApprovalService } from '../approval/approval.service';
import { Role } from '../auth/roles.decorator';

type InvoiceWithRelations = Prisma.InvoiceGetPayload<{
  include: {
    resident: { include: { user: true; units: { include: { building: true } } } };
    paymentIntents: { include: { paymentMethod: true; refunds: true } };
    ledgerEntries: true;
  };
}>;

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private prisma: PrismaService,
    private receipts: ReceiptService,
    private tranzilaProvider: TranzilaProvider,
    private stripeProvider: StripeProvider,
    private routingStrategy: PaymentRoutingStrategy,
    private activity: ActivityService,
    private approvals: ApprovalService,
  ) {}

  private getProviderByName(name: string): PaymentProvider {
    return name === this.stripeProvider.name ? this.stripeProvider : this.tranzilaProvider;
  }

  private getRoutingContext(invoice: { amount: number; currency?: string }, metadata?: Record<string, any>): RoutingContext {
    return {
      amount: invoice.amount,
      currency: invoice.currency || 'NIS',
      cardType: metadata?.cardType || 'unknown',
      cardBin: metadata?.cardBin,
      countryCode: metadata?.countryCode,
    };
  }

  private invoiceInclude = {
    resident: {
      include: {
        user: true,
        units: {
          include: {
            building: true,
          },
        },
      },
    },
    paymentIntents: {
      include: {
        paymentMethod: true,
        refunds: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    },
    ledgerEntries: true,
  } as const;

  private getInvoiceDescription(items: any[]): string {
    if (!Array.isArray(items) || items.length === 0) return 'General charge';
    return items
      .map((item) => item?.description || item?.name || 'Charge')
      .filter(Boolean)
      .join(', ');
  }

  private getInvoiceType(items: any[]): 'MAINTENANCE' | 'UTILITIES' | 'MANAGEMENT' | 'PARKING' | 'OTHER' {
    const haystack = JSON.stringify(items || []).toLowerCase();
    if (haystack.includes('maint') || haystack.includes('repair') || haystack.includes('service')) return 'MAINTENANCE';
    if (haystack.includes('utility') || haystack.includes('electric') || haystack.includes('water')) return 'UTILITIES';
    if (haystack.includes('manage') || haystack.includes('hoa') || haystack.includes('fee')) return 'MANAGEMENT';
    if (haystack.includes('park')) return 'PARKING';
    return 'OTHER';
  }

  private getDueDate(createdAt: Date, dueDate?: Date | null, dueDays = 30) {
    if (dueDate) {
      return new Date(dueDate);
    }
    return new Date(createdAt.getTime() + dueDays * 24 * 60 * 60 * 1000);
  }

  private mapInvoiceStatus(invoice: { status: InvoiceStatus; createdAt: Date; dueDate?: Date | null }) {
    if (invoice.status === InvoiceStatus.PAID) return 'PAID' as const;
    return this.getDueDate(invoice.createdAt, invoice.dueDate) < new Date() ? ('OVERDUE' as const) : ('PENDING' as const);
  }

  private getAgingBucket(dueDate: Date, status: 'PENDING' | 'PAID' | 'OVERDUE') {
    if (status === 'PAID') return 'paid';
    const overdueDays = Math.max(0, Math.floor((Date.now() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));
    if (overdueDays === 0) return 'current';
    if (overdueDays <= 30) return '1-30';
    if (overdueDays <= 60) return '31-60';
    if (overdueDays <= 90) return '61-90';
    return '90+';
  }

  private csvValue(value: unknown) {
    if (value === null || value === undefined) return '""';
    const normalized = value instanceof Date ? value.toISOString() : String(value);
    return `"${normalized.replace(/"/g, '""')}"`;
  }

  private toIntentStatus(status: string): PaymentIntentStatus {
    switch (status) {
      case 'requires_payment_method':
        return PaymentIntentStatus.REQUIRES_PAYMENT_METHOD;
      case 'requires_action':
        return PaymentIntentStatus.REQUIRES_ACTION;
      case 'processing':
        return PaymentIntentStatus.PROCESSING;
      case 'succeeded':
        return PaymentIntentStatus.SUCCEEDED;
      case 'canceled':
        return PaymentIntentStatus.CANCELED;
      case 'failed':
      default:
        return PaymentIntentStatus.FAILED;
    }
  }

  private async withProviderRetry<T>(operation: () => Promise<T>, maxAttempts = 3, delayMs = 250): Promise<T> {
    let lastError: unknown;
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        if (attempt === maxAttempts) break;
        await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
      }
    }
    throw lastError;
  }

  private mapInvoice(invoice: InvoiceWithRelations) {
    const latestIntent = invoice.paymentIntents[0];
    const dueDate = this.getDueDate(new Date(invoice.createdAt), invoice.dueDate);
    const status = this.mapInvoiceStatus(invoice);
    const building = invoice.resident?.units?.[0]?.building ?? null;
    const lateFees = invoice.ledgerEntries
      .filter((entry) => entry.entryType === 'late_fee')
      .reduce((sum, entry) => sum + entry.amount, 0);

    return {
      id: invoice.id,
      residentId: invoice.residentId,
      residentName: invoice.resident?.user?.email ?? `Resident #${invoice.residentId}`,
      buildingId: building?.id ?? null,
      buildingName: building?.name ?? null,
      amount: invoice.amount,
      description: this.getInvoiceDescription(invoice.items as any[]),
      issueDate: invoice.createdAt,
      dueDate,
      status,
      type: this.getInvoiceType(invoice.items as any[]),
      paymentMethod: latestIntent?.paymentMethod?.brand || latestIntent?.provider || null,
      paidAt: invoice.status === InvoiceStatus.PAID ? latestIntent?.updatedAt ?? invoice.createdAt : null,
      receiptNumber: invoice.status === InvoiceStatus.PAID ? `REC-${invoice.id}` : null,
      category: this.getInvoiceType(invoice.items as any[]),
      lateFeeAmount: invoice.lateFeeAmount ?? lateFees ?? 0,
      reminderState: invoice.reminderState,
      collectionStatus: invoice.collectionStatus,
      promiseToPayDate: invoice.promiseToPayDate,
      collectionNotes: invoice.collectionNotes,
      lastReminderAt: invoice.lastReminderAt,
      agingBucket: this.getAgingBucket(dueDate, status),
      history: [
        ...invoice.paymentIntents.map((intent) => ({
          kind: 'PAYMENT',
          id: intent.id,
          status: intent.status,
          amount: intent.amount,
          createdAt: intent.createdAt,
        })),
        ...invoice.paymentIntents.flatMap((intent) =>
          intent.refunds.map((refund) => ({
            kind: 'REFUND',
            id: refund.id,
            status: 'REFUNDED',
            amount: refund.amount,
            createdAt: refund.createdAt,
          })),
        ),
        ...invoice.ledgerEntries
          .filter((entry) => entry.entryType === 'late_fee' || entry.entryType === 'adjustment')
          .map((entry) => ({
            kind: entry.entryType === 'late_fee' ? 'LATE_FEE' : 'ADJUSTMENT',
            id: entry.id,
            status: 'POSTED',
            amount: entry.amount,
            createdAt: entry.createdAt,
          })),
      ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    };
  }

  private mapRecurring(recurring: any) {
    return {
      ...recurring,
      residentName: recurring.resident?.user?.email ?? `Resident #${recurring.residentId}`,
      units: recurring.resident?.units ?? [],
    };
  }

  private async resolveResidentId(residentId: number) {
    if (!Number.isInteger(residentId) || residentId <= 0) {
      throw new BadRequestException('residentId must be a positive integer.');
    }

    const resident = await this.prisma.resident.findFirst({
      where: {
        OR: [{ id: residentId }, { userId: residentId }],
      },
      select: { id: true },
    });

    if (!resident) {
      throw new BadRequestException(`Resident not found for identifier ${residentId}.`);
    }

    return resident.id;
  }

  private async assertResidentOwnsInvoice(invoiceId: number, actorUserId?: number) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        resident: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!invoice) {
      throw new BadRequestException('Invoice not found.');
    }
    if (invoice.resident.userId !== actorUserId) {
      throw new ForbiddenException('Residents may only access their own invoices.');
    }
    return invoice;
  }

  private async assertResidentOwnsPaymentIntent(paymentIntentId: number, actorUserId?: number) {
    const intent = await this.prisma.paymentIntent.findUnique({
      where: { id: paymentIntentId },
      include: {
        invoice: {
          include: {
            resident: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    if (!intent) {
      throw new BadRequestException('Payment intent not found.');
    }
    if (intent.invoice.resident.userId !== actorUserId) {
      throw new ForbiddenException('Residents may only access their own payment intents.');
    }
    return intent;
  }

  private async logInvoiceActivity(
    invoice: { id: number; residentId: number; resident?: { units?: Array<{ buildingId: number }> } | null },
    userId: number | undefined,
    action: string,
    summary: string,
    severity: ActivitySeverity = ActivitySeverity.INFO,
    metadata?: Prisma.InputJsonValue,
  ) {
    await this.activity.log({
      userId,
      residentId: invoice.residentId,
      buildingId: invoice.resident?.units?.[0]?.buildingId ?? null,
      entityType: 'INVOICE',
      entityId: invoice.id,
      action,
      summary,
      severity,
      metadata,
    });
  }


  private readonly webhookEventHandlers: Record<string, PaymentIntentStatus> = {
    'payment.succeeded': PaymentIntentStatus.SUCCEEDED,
    'payment.failed': PaymentIntentStatus.FAILED,
    'payment.canceled': PaymentIntentStatus.CANCELED,
    'payment.cancelled': PaymentIntentStatus.CANCELED,
    'payment.processing': PaymentIntentStatus.PROCESSING,
    'payment.requires_action': PaymentIntentStatus.REQUIRES_ACTION,
    'payment.refunded': PaymentIntentStatus.CANCELED,
  };

  private canTransitionIntent(current: PaymentIntentStatus, next: PaymentIntentStatus): boolean {
    if (current === next) return true;
    const allowed: Record<PaymentIntentStatus, PaymentIntentStatus[]> = {
      [PaymentIntentStatus.REQUIRES_PAYMENT_METHOD]: [
        PaymentIntentStatus.PROCESSING,
        PaymentIntentStatus.REQUIRES_ACTION,
        PaymentIntentStatus.CANCELED,
        PaymentIntentStatus.FAILED,
        PaymentIntentStatus.SUCCEEDED,
      ],
      [PaymentIntentStatus.REQUIRES_CONFIRMATION]: [
        PaymentIntentStatus.PROCESSING,
        PaymentIntentStatus.REQUIRES_ACTION,
        PaymentIntentStatus.CANCELED,
        PaymentIntentStatus.FAILED,
        PaymentIntentStatus.SUCCEEDED,
      ],
      [PaymentIntentStatus.REQUIRES_ACTION]: [
        PaymentIntentStatus.PROCESSING,
        PaymentIntentStatus.CANCELED,
        PaymentIntentStatus.FAILED,
        PaymentIntentStatus.SUCCEEDED,
      ],
      [PaymentIntentStatus.PROCESSING]: [PaymentIntentStatus.SUCCEEDED, PaymentIntentStatus.FAILED, PaymentIntentStatus.CANCELED],
      [PaymentIntentStatus.SUCCEEDED]: [PaymentIntentStatus.CANCELED],
      [PaymentIntentStatus.FAILED]: [PaymentIntentStatus.REQUIRES_PAYMENT_METHOD],
      [PaymentIntentStatus.CANCELED]: [],
    };

    return allowed[current]?.includes(next) ?? false;
  }

  async processWebhook(payload: any, signature?: string, rawBody?: string) {
    const verified = await this.tranzilaProvider.webhookVerify(signature, payload, rawBody);
    if (!verified.ok) {
      throw new UnauthorizedException('Invalid webhook signature.');
    }

    const provider = this.tranzilaProvider.name;
    const eventId = verified.eventId as string;
    const eventType = (verified.type || '').toLowerCase();

    try {
      await this.prisma.webhookEvent.create({
        data: {
          provider,
          eventId,
          signature: signature || null,
          payload: verified.data ?? payload ?? {},
          processed: false,
        },
      });
    } catch (error: any) {
      if (error?.code === 'P2002') {
        this.logger.log(`Duplicate webhook ignored for ${provider}:${eventId}`);
        return { ok: true, duplicate: true };
      }
      throw error;
    }

    const mappedStatus = this.webhookEventHandlers[eventType];
    if (!mappedStatus) {
      await this.prisma.webhookEvent.update({
        where: { provider_eventId: { provider, eventId } },
        data: { processed: true },
      });
      this.logger.warn(`Ignoring unhandled webhook type: ${eventType || 'unknown'}`);
      return { ok: true, ignored: true };
    }

    const providerIntentId = String(payload?.providerIntentId || payload?.intentId || payload?.paymentIntentId || '');
    if (!providerIntentId) {
      await this.prisma.webhookEvent.update({
        where: { provider_eventId: { provider, eventId } },
        data: { processed: true },
      });
      this.logger.warn(`Webhook ${eventId} missing provider intent identifier.`);
      return { ok: true, ignored: true };
    }

    const intent = await this.prisma.paymentIntent.findFirst({
      where: { provider, providerIntentId },
      include: { invoice: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!intent) {
      await this.prisma.webhookEvent.update({
        where: { provider_eventId: { provider, eventId } },
        data: { processed: true },
      });
      this.logger.warn(`No payment intent found for providerIntentId=${providerIntentId}`);
      return { ok: true, ignored: true };
    }

    if (!this.canTransitionIntent(intent.status, mappedStatus)) {
      await this.prisma.webhookEvent.update({
        where: { provider_eventId: { provider, eventId } },
        data: { processed: true },
      });
      this.logger.warn(`Rejected invalid payment transition ${intent.status} -> ${mappedStatus} for intent ${intent.id}`);
      return { ok: true, ignored: true };
    }

    await this.prisma.paymentIntent.update({
      where: { id: intent.id },
      data: {
        status: mappedStatus,
        metadata: verified.data ?? payload ?? {},
      },
    });

    if (mappedStatus === PaymentIntentStatus.SUCCEEDED) {
      await this.confirmPayment(intent.invoiceId);
    } else if (mappedStatus === PaymentIntentStatus.CANCELED || mappedStatus === PaymentIntentStatus.FAILED) {
      await this.prisma.invoice.update({
        where: { id: intent.invoiceId },
        data: { status: InvoiceStatus.UNPAID, collectionStatus: CollectionStatus.PAST_DUE },
      });
    }

    await this.prisma.providerTransaction.create({
      data: {
        paymentIntentId: intent.id,
        provider,
        type: 'webhook',
        status: mappedStatus.toLowerCase(),
        raw: verified.data ?? payload ?? {},
      },
    });

    await this.prisma.webhookEvent.update({
      where: { provider_eventId: { provider, eventId } },
      data: { processed: true },
    });

    return { ok: true };
  }

  async createInvoice(
    data: {
      residentId: number;
      items: any[];
      amount?: number;
      dueDate?: string;
      lateFeeAmount?: number;
      collectionNotes?: string;
    },
    userId?: number,
  ) {
    const residentId = await this.resolveResidentId(data.residentId);
    const computedAmount =
      data.amount ??
      data.items.reduce((sum: number, item: any) => sum + Number(item.quantity || 1) * Number(item.unitPrice || item.amount || 0), 0);

    const invoice = await this.prisma.invoice.create({
      data: {
        resident: { connect: { id: residentId } },
        items: data.items,
        amount: computedAmount,
        dueDate: data.dueDate ? new Date(data.dueDate) : this.getDueDate(new Date()),
        lateFeeAmount: data.lateFeeAmount ?? 0,
        collectionNotes: data.collectionNotes,
      },
      include: this.invoiceInclude,
    });

    await this.prisma.ledgerEntry.create({
      data: {
        invoiceId: invoice.id,
        entryType: 'charge',
        amount: invoice.amount,
        debit: 'Accounts Receivable',
        credit: 'Revenue',
      },
    });

    await this.logInvoiceActivity(invoice, userId, 'INVOICE_CREATED', `נוצר חיוב חדש עבור ${invoice.resident.user?.email ?? `דייר ${invoice.residentId}`}.`, ActivitySeverity.INFO, {
      amount: invoice.amount,
      dueDate: invoice.dueDate?.toISOString() ?? null,
    });

    return this.mapInvoice(
      await this.prisma.invoice.findUniqueOrThrow({
        where: { id: invoice.id },
        include: this.invoiceInclude,
      }),
    );
  }

  async listUnpaid(residentId?: number) {
    const resolvedResidentId = residentId ? await this.resolveResidentId(residentId) : undefined;
    return this.prisma.invoice
      .findMany({
        where: {
          status: InvoiceStatus.UNPAID,
          ...(resolvedResidentId ? { residentId: resolvedResidentId } : {}),
        },
        include: this.invoiceInclude,
        orderBy: { createdAt: 'desc' },
      })
      .then((invoices) => invoices.map((invoice) => this.mapInvoice(invoice)));
  }

  async listInvoices(residentId?: number, status?: 'PENDING' | 'PAID' | 'OVERDUE') {
    const resolvedResidentId = residentId ? await this.resolveResidentId(residentId) : undefined;
    return this.prisma.invoice
      .findMany({
        where: {
          ...(resolvedResidentId ? { residentId: resolvedResidentId } : {}),
        },
        include: this.invoiceInclude,
        orderBy: { createdAt: 'desc' },
      })
      .then((invoices) => {
        const mapped = invoices.map((invoice) => this.mapInvoice(invoice));
        return status ? mapped.filter((invoice) => invoice.status === status) : mapped;
      });
  }

  async getResidentLedger(residentId: number) {
    const resolvedResidentId = await this.resolveResidentId(residentId);
    const resident = await this.prisma.resident.findUniqueOrThrow({
      where: { id: resolvedResidentId },
      include: {
        user: true,
        units: {
          include: {
            building: true,
          },
        },
        invoices: {
          include: this.invoiceInclude,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    const entries = resident.invoices.flatMap((invoice) => {
      const mapped = this.mapInvoice(invoice as InvoiceWithRelations);
      return [
        {
          id: `charge-${invoice.id}`,
          invoiceId: invoice.id,
          type: 'CHARGE',
          amount: invoice.amount,
          createdAt: invoice.createdAt,
          summary: mapped.description,
          status: mapped.status,
        },
        ...invoice.ledgerEntries.map((entry) => ({
          id: `ledger-${entry.id}`,
          invoiceId: invoice.id,
          type: entry.entryType.toUpperCase(),
          amount: entry.amount,
          createdAt: entry.createdAt,
          summary: `${entry.debit} -> ${entry.credit}`,
          status: mapped.status,
        })),
        ...invoice.paymentIntents.map((intent) => ({
          id: `payment-${intent.id}`,
          invoiceId: invoice.id,
          type: 'PAYMENT',
          amount: -intent.amount,
          createdAt: intent.updatedAt,
          summary: `${intent.provider} ${intent.status}`,
          status: mapped.status,
        })),
      ];
    });

    const orderedEntries = entries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const outstandingBalance = resident.invoices
      .map((invoice) => this.mapInvoice(invoice as InvoiceWithRelations))
      .filter((invoice) => invoice.status !== 'PAID')
      .reduce((sum, invoice) => sum + invoice.amount, 0);

    return {
      resident: {
        id: resident.id,
        email: resident.user.email,
        phone: resident.user.phone,
        units: resident.units.map((unit) => ({
          id: unit.id,
          number: unit.number,
          building: unit.building,
        })),
      },
      outstandingBalance,
      entries: orderedEntries,
    };
  }

  async getResidentAccount(residentId: number) {
    const resolvedResidentId = await this.resolveResidentId(residentId);
    const resident = await this.prisma.resident.findUniqueOrThrow({
      where: { id: resolvedResidentId },
      include: {
        user: true,
        units: {
          include: {
            building: true,
          },
        },
      },
    });

    const unitIds = resident.units.map((unit) => unit.id);
    const buildingIds = resident.units.map((unit) => unit.buildingId);
    const [invoices, notifications, communications, residentDocuments, residentTickets, activity] = await Promise.all([
      this.prisma.invoice.findMany({
        where: { residentId: resolvedResidentId },
        include: this.invoiceInclude,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.findMany({
        where: { userId: resident.userId },
        orderBy: { createdAt: 'desc' },
        take: 12,
      }),
      this.prisma.communication.findMany({
        where: {
          OR: [
            { recipientId: resident.userId },
            { buildingId: { in: buildingIds } },
          ],
        },
        orderBy: { createdAt: 'desc' },
        take: 12,
      }),
      this.prisma.document.findMany({
        where: {
          OR: [
            { buildingId: { in: buildingIds }, accessLevel: 'PUBLIC' },
            { unitId: { in: unitIds } },
            { sharedWith: { some: { userId: resident.userId } } },
          ],
        },
        orderBy: { uploadedAt: 'desc' },
        take: 12,
      }),
      this.prisma.ticket.findMany({
        where: { unitId: { in: unitIds } },
        include: {
          unit: { include: { building: true } },
          workOrders: true,
          comments: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 12,
      }),
      this.activity.list({ residentId: resolvedResidentId, limit: 20 }),
    ]);

    const mappedInvoices = invoices.map((invoice) => this.mapInvoice(invoice));
    const currentBalance = mappedInvoices.filter((invoice) => invoice.status !== 'PAID').reduce((sum, invoice) => sum + invoice.amount, 0);

    return {
      resident: {
        id: resident.id,
        email: resident.user.email,
        phone: resident.user.phone,
        units: resident.units,
      },
      summary: {
        currentBalance,
        unpaidInvoices: mappedInvoices.filter((invoice) => invoice.status !== 'PAID').length,
        overdueInvoices: mappedInvoices.filter((invoice) => invoice.status === 'OVERDUE').length,
        openTickets: residentTickets.filter((ticket) => ticket.status !== 'RESOLVED').length,
        unreadNotifications: notifications.filter((notification) => !notification.read).length,
      },
      invoices: mappedInvoices.slice(0, 12),
      ledger: (await this.getResidentLedger(resolvedResidentId)).entries.slice(0, 20),
      tickets: residentTickets,
      notifications,
      communications,
      documents: residentDocuments,
      recentActivity: activity,
    };
  }

  async getCollectionsDashboard(buildingId?: number) {
    const invoices = await this.prisma.invoice.findMany({
      where: buildingId
        ? {
            resident: {
              units: {
                some: { buildingId },
              },
            },
          }
        : undefined,
      include: this.invoiceInclude,
      orderBy: { createdAt: 'desc' },
    });

    const mapped = invoices.map((invoice) => this.mapInvoice(invoice));
    const unpaid = mapped.filter((invoice) => invoice.status !== 'PAID');
    const totalOutstanding = unpaid.reduce((sum, invoice) => sum + invoice.amount, 0);
    const overdue = unpaid.filter((invoice) => invoice.status === 'OVERDUE');
    const billedThisMonth = mapped
      .filter((invoice) => {
        const createdAt = new Date(invoice.issueDate);
        const now = new Date();
        return createdAt.getMonth() === now.getMonth() && createdAt.getFullYear() === now.getFullYear();
      })
      .reduce((sum, invoice) => sum + invoice.amount, 0);
    const collectedThisMonth = mapped
      .filter((invoice) => invoice.paidAt)
      .filter((invoice) => {
        const paidAt = new Date(invoice.paidAt as Date);
        const now = new Date();
        return paidAt.getMonth() === now.getMonth() && paidAt.getFullYear() === now.getFullYear();
      })
      .reduce((sum, invoice) => sum + invoice.amount, 0);

    const aging = unpaid.reduce(
      (acc, invoice) => {
        const key = invoice.agingBucket ?? 'current';
        acc[key] = (acc[key] ?? 0) + invoice.amount;
        return acc;
      },
      {} as Record<string, number>,
    );

    const debtorMap = unpaid.reduce(
      (acc, invoice) => {
        const key = `${invoice.residentId}`;
        if (!acc[key]) {
          acc[key] = {
            residentId: invoice.residentId,
            residentName: invoice.residentName,
            buildingName: invoice.buildingName,
            amount: 0,
            overdueCount: 0,
            promiseToPayDate: invoice.promiseToPayDate ?? null,
          };
        }
        acc[key].amount += invoice.amount;
        if (invoice.status === 'OVERDUE') acc[key].overdueCount += 1;
        if (!acc[key].promiseToPayDate && invoice.promiseToPayDate) {
          acc[key].promiseToPayDate = invoice.promiseToPayDate;
        }
        return acc;
      },
      {} as Record<
        string,
        {
          residentId: number;
          residentName: string;
          buildingName: string | null;
          amount: number;
          overdueCount: number;
          promiseToPayDate: Date | null;
        }
      >,
    );

    const followUps = unpaid
      .filter((invoice) => invoice.collectionNotes || invoice.promiseToPayDate || invoice.lastReminderAt)
      .map((invoice) => ({
        invoiceId: invoice.id,
        residentId: invoice.residentId,
        residentName: invoice.residentName,
        buildingName: invoice.buildingName,
        collectionStatus: invoice.collectionStatus,
        reminderState: invoice.reminderState,
        promiseToPayDate: invoice.promiseToPayDate,
        lastReminderAt: invoice.lastReminderAt,
        collectionNotes: invoice.collectionNotes,
      }))
      .sort((a, b) => {
        const left = new Date(b.lastReminderAt ?? b.promiseToPayDate ?? 0).getTime();
        const right = new Date(a.lastReminderAt ?? a.promiseToPayDate ?? 0).getTime();
        return left - right;
      });

    return {
      buildingId: buildingId ?? null,
      totals: {
        invoiceCount: mapped.length,
        unpaidCount: unpaid.length,
        overdueCount: overdue.length,
        outstandingBalance: totalOutstanding,
        delinquencyRate: mapped.length ? Number(((overdue.length / mapped.length) * 100).toFixed(1)) : 0,
        billedThisMonth,
        collectedThisMonth,
      },
      aging,
      topDebtors: Object.values(debtorMap)
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 10),
      followUps: followUps.slice(0, 20),
    };
  }

  async exportInvoicesCsv(type: 'invoices' | 'unpaid' | 'ledger', residentId?: number, buildingId?: number, userId?: number) {
    if (type === 'ledger' && residentId) {
      const ledger = await this.getResidentLedger(residentId);
      const csv = [
        ['entryId', 'invoiceId', 'type', 'amount', 'createdAt', 'summary', 'status'].join(','),
        ...ledger.entries.map((entry) =>
          [
            this.csvValue(entry.id),
            entry.invoiceId,
            this.csvValue(entry.type),
            entry.amount,
            this.csvValue(entry.createdAt),
            this.csvValue(entry.summary),
            this.csvValue(entry.status),
          ].join(','),
        ),
      ].join('\n');
      await this.activity.log({
        userId,
        residentId: ledger.resident.id,
        buildingId: ledger.resident.units[0]?.building.id ?? null,
        entityType: 'EXPORT',
        action: 'LEDGER_EXPORT',
        summary: 'בוצע יצוא של דוח יתרת דייר.',
        severity: ActivitySeverity.WARNING,
        metadata: { type, residentId: ledger.resident.id },
      });
      return csv;
    }

    const invoices = await this.prisma.invoice.findMany({
      where: {
        ...(residentId ? { residentId } : {}),
        ...(type === 'unpaid' ? { status: InvoiceStatus.UNPAID } : {}),
        ...(buildingId
          ? {
              resident: {
                units: {
                  some: { buildingId },
                },
              },
            }
          : {}),
      },
      include: this.invoiceInclude,
      orderBy: { createdAt: 'desc' },
    });

    const csv = [
      [
        'invoiceId',
        'residentId',
        'residentName',
        'buildingName',
        'amount',
        'status',
        'dueDate',
        'agingBucket',
        'reminderState',
        'collectionStatus',
        'promiseToPayDate',
        'lastReminderAt',
        'description',
      ].join(','),
      ...invoices.map((invoice) => {
        const mapped = this.mapInvoice(invoice);
        return [
          mapped.id,
          mapped.residentId,
          this.csvValue(mapped.residentName),
          this.csvValue(mapped.buildingName),
          mapped.amount,
          this.csvValue(mapped.status),
          this.csvValue(mapped.dueDate),
          this.csvValue(mapped.agingBucket),
          this.csvValue(mapped.reminderState),
          this.csvValue(mapped.collectionStatus),
          this.csvValue(mapped.promiseToPayDate),
          this.csvValue(mapped.lastReminderAt),
          this.csvValue(mapped.description),
        ].join(',');
      }),
    ].join('\n');
    await this.activity.log({
      userId,
      buildingId: buildingId ?? null,
      residentId: residentId ?? null,
      entityType: 'EXPORT',
      action: type === 'unpaid' ? 'UNPAID_EXPORT' : 'INVOICE_EXPORT',
      summary: `בוצע יצוא CSV עבור ${type === 'unpaid' ? 'יתרות פתוחות' : 'חשבוניות'}.`,
      severity: ActivitySeverity.WARNING,
      metadata: { type, residentId: residentId ?? null, buildingId: buildingId ?? null },
    });
    return csv;
  }

  async initiatePayment(id: number, actorUserId?: number, actorRole?: Role) {
    const invoice =
      actorRole === Role.RESIDENT
        ? await this.assertResidentOwnsInvoice(id, actorUserId)
        : await this.prisma.invoice.findUnique({
            where: { id },
            include: { resident: { include: { user: true } } },
          });
    if (!invoice) throw new Error('Invoice not found');

    const routingContext = this.getRoutingContext({ amount: invoice.amount, currency: 'NIS' });
    const route = this.routingStrategy.selectProvider([this.tranzilaProvider, this.stripeProvider], routingContext);
    const selectedProvider = route.provider;
    const feeEstimate = selectedProvider.estimateFees(routingContext);

    const intent = await this.prisma.paymentIntent.create({
      data: {
        invoiceId: invoice.id,
        amount: invoice.amount,
        grossAmount: invoice.amount,
        providerFeeEstimated: feeEstimate.estimatedFee,
        netAmount: feeEstimate.estimatedNet,
        currency: 'NIS',
        status: PaymentIntentStatus.REQUIRES_CONFIRMATION,
        provider: selectedProvider.name,
      },
    });

    const start = Date.now();
    let result: any;
    let usedProvider = selectedProvider;
    try {
      result = await this.withProviderRetry(() =>
        selectedProvider.createPayment({
          amount: invoice.amount,
          currency: 'NIS',
          description: `Invoice #${invoice.id}`,
          metadata: { invoiceId: invoice.id, residentId: invoice.residentId, routeReason: route.reason },
        }),
      );
    } catch (error) {
      if (!route.fallbackProvider || !this.routingStrategy.shouldFailover(error)) {
        throw error;
      }
      usedProvider = route.fallbackProvider;
      this.logger.warn(`Payment routing failover: ${selectedProvider.name} -> ${usedProvider.name}`);
      result = await this.withProviderRetry(() =>
        usedProvider.createPayment({
          amount: invoice.amount,
          currency: 'NIS',
          description: `Invoice #${invoice.id}`,
          metadata: { invoiceId: invoice.id, residentId: invoice.residentId, routeReason: `${route.reason}:fallback` },
        }),
      );
    }

    const latencyMs = Date.now() - start;
    const internalStatus = this.toIntentStatus(result.requiresAction ? 'requires_action' : 'processing');
    await this.prisma.paymentIntent.update({
      where: { id: intent.id },
      data: {
        provider: usedProvider.name,
        providerIntentId: result.providerIntentId || String(intent.id),
        clientSecret: result.clientSecret || null,
        status: internalStatus,
        providerLatencyMs: latencyMs,
        metadata: { ...(result.raw ?? {}), routeReason: route.reason, routedProvider: usedProvider.name },
      },
    });
    return { intentId: intent.id, redirectUrl: result.redirectUrl, clientSecret: result.clientSecret };
  }

  async confirmPayment(invoiceId: number, userId?: number) {
    const existing = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: this.invoiceInclude,
    });
    if (!existing) throw new Error('Invoice not found');
    if (existing.status === InvoiceStatus.PAID) {
      return existing;
    }

    const latestIntent = existing.paymentIntents[0];
    if (!latestIntent) {
      throw new BadRequestException('Payment intent not found for invoice.');
    }

    const providerIntentId = latestIntent.providerIntentId || String(latestIntent.id);
    const providerResult = await this.withProviderRetry(() => this.getProviderByName(latestIntent.provider).retrieve(providerIntentId));
    const verifiedStatus = this.toIntentStatus(providerResult.status);

    await this.prisma.paymentIntent.update({
      where: { id: latestIntent.id },
      data: {
        status: verifiedStatus,
        metadata: providerResult.raw ?? undefined,
      },
    });

    if (verifiedStatus !== PaymentIntentStatus.SUCCEEDED) {
      return existing;
    }

    const invoice = await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: InvoiceStatus.PAID,
        collectionStatus: CollectionStatus.RESOLVED,
        reminderState: InvoiceReminderState.PROMISED,
      },
      include: this.invoiceInclude,
    });
    await this.prisma.ledgerEntry.create({
      data: { invoiceId, entryType: 'payment', amount: invoice.amount, debit: 'Cash', credit: 'Accounts Receivable' },
    });
    await this.receipts.generate(invoice);
    await this.logInvoiceActivity(invoice, userId, 'PAYMENT_CONFIRMED', `התשלום עבור חשבונית #${invoice.id} אושר.`, ActivitySeverity.INFO, {
      amount: invoice.amount,
    });
    return invoice;
  }

  async settleInvoice(invoiceId: number, userId?: number) {
    const invoice = await this.prisma.invoice.findUniqueOrThrow({
      where: { id: invoiceId },
    });

    const existingIntent = await this.prisma.paymentIntent.findFirst({
      where: { invoiceId },
      orderBy: { createdAt: 'desc' },
    });

    if (!existingIntent) {
      await this.prisma.paymentIntent.create({
        data: {
          invoiceId,
          amount: invoice.amount,
          currency: 'NIS',
          provider: 'manual',
          status: PaymentIntentStatus.PROCESSING,
        },
      });
    }

    await this.confirmPayment(invoiceId, userId);

    const updated = await this.prisma.invoice.findUniqueOrThrow({
      where: { id: invoiceId },
      include: this.invoiceInclude,
    });
    return this.mapInvoice(updated);
  }

  async createPaymentIntentFromInvoice(invoiceId: number) {
    const invoice = await this.prisma.invoice.findUniqueOrThrow({ where: { id: invoiceId } });
    const routingContext = this.getRoutingContext({ amount: invoice.amount, currency: 'NIS' });
    const route = this.routingStrategy.selectProvider([this.tranzilaProvider, this.stripeProvider], routingContext);
    const provider = route.provider;
    const feeEstimate = provider.estimateFees(routingContext);

    const intent = await this.prisma.paymentIntent.create({
      data: {
        invoiceId: invoice.id,
        amount: invoice.amount,
        grossAmount: invoice.amount,
        providerFeeEstimated: feeEstimate.estimatedFee,
        netAmount: feeEstimate.estimatedNet,
        currency: 'NIS',
        status: PaymentIntentStatus.REQUIRES_CONFIRMATION,
        provider: provider.name,
      },
    });

    const start = Date.now();
    const result = await this.withProviderRetry(() =>
      provider.createPayment({
        amount: invoice.amount,
        currency: 'NIS',
        description: `Invoice #${invoice.id}`,
        metadata: { invoiceId: invoice.id, routeReason: route.reason },
      }),
    );
    await this.prisma.paymentIntent.update({
      where: { id: intent.id },
      data: {
        providerIntentId: result.providerIntentId || String(intent.id),
        clientSecret: result.clientSecret || null,
        status: this.toIntentStatus(result.requiresAction ? 'requires_action' : 'processing'),
        providerLatencyMs: Date.now() - start,
        metadata: { ...(result.raw ?? {}), routeReason: route.reason },
      },
    });
    return { id: intent.id, status: intent.status, redirectUrl: result.redirectUrl, clientSecret: result.clientSecret };
  }

  async refund(paymentIntentId: number, amount?: number) {
    const intent = await this.prisma.paymentIntent.findUniqueOrThrow({
      where: { id: paymentIntentId },
      include: { invoice: true },
    });
    const res = await this.withProviderRetry(() =>
      this.getProviderByName(intent.provider).refund({ providerIntentId: intent.providerIntentId || String(intent.id), amount }),
    );
    await this.prisma.refund.create({
      data: { paymentIntentId: intent.id, amount: amount ?? intent.amount, providerRefundId: res.providerRefundId || undefined },
    });
    await this.prisma.ledgerEntry.create({
      data: {
        invoiceId: intent.invoiceId,
        paymentIntentId: intent.id,
        entryType: 'refund',
        amount: -(amount ?? intent.amount),
        debit: 'Accounts Receivable',
        credit: 'Cash',
      },
    });
    await this.prisma.invoice.update({
      where: { id: intent.invoiceId },
      data: { status: InvoiceStatus.UNPAID, collectionStatus: CollectionStatus.PAST_DUE },
    });
    return { ok: true };
  }

  async getPayment(paymentIntentId: number, actorUserId?: number, actorRole?: Role) {
    if (actorRole === Role.RESIDENT) {
      return this.assertResidentOwnsPaymentIntent(paymentIntentId, actorUserId);
    }
    return this.prisma.paymentIntent.findUniqueOrThrow({ where: { id: paymentIntentId } });
  }



  async reconcilePaymentIntent(paymentIntentId: number, data: { providerFeeActual: number; settlementBatchId: string }) {
    const intent = await this.prisma.paymentIntent.findUniqueOrThrow({ where: { id: paymentIntentId } });
    const netAmount = Number((intent.grossAmount ?? intent.amount) - data.providerFeeActual);
    return this.prisma.paymentIntent.update({
      where: { id: paymentIntentId },
      data: {
        providerFeeActual: data.providerFeeActual,
        netAmount,
        settlementBatchId: data.settlementBatchId,
      },
    });
  }

  async getProviderEconomicsReport() {
    const intents = await this.prisma.paymentIntent.findMany({
      select: {
        provider: true,
        amount: true,
        grossAmount: true,
        providerFeeEstimated: true,
        providerFeeActual: true,
        netAmount: true,
        status: true,
      },
    });

    const grouped: Record<string, any> = {};
    for (const intent of intents) {
      const bucket = (grouped[intent.provider] ??= {
        provider: intent.provider,
        count: 0,
        succeeded: 0,
        grossTotal: 0,
        estimatedFeesTotal: 0,
        actualFeesTotal: 0,
        netTotal: 0,
      });
      bucket.count += 1;
      if (intent.status === PaymentIntentStatus.SUCCEEDED) bucket.succeeded += 1;
      bucket.grossTotal += intent.grossAmount ?? intent.amount ?? 0;
      bucket.estimatedFeesTotal += intent.providerFeeEstimated ?? 0;
      bucket.actualFeesTotal += intent.providerFeeActual ?? 0;
      bucket.netTotal += intent.netAmount ?? 0;
    }

    return Object.values(grouped).map((row: any) => ({
      ...row,
      approvalRate: row.count ? Number((row.succeeded / row.count).toFixed(4)) : 0,
      avgEstimatedCost: row.count ? Number((row.estimatedFeesTotal / row.count).toFixed(2)) : 0,
    }));
  }

  async applyLatePenalty(invoiceId: number, penaltyAmount: number, userId?: number) {
    const invoice = await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        amount: { increment: penaltyAmount } as any,
        lateFeeAmount: { increment: penaltyAmount } as any,
        collectionStatus: CollectionStatus.PAST_DUE,
      },
      include: this.invoiceInclude,
    });
    await this.prisma.ledgerEntry.create({
      data: {
        invoiceId,
        entryType: 'late_fee',
        amount: penaltyAmount,
        debit: 'Accounts Receivable',
        credit: 'Late Fee Revenue',
      },
    });
    await this.logInvoiceActivity(invoice, userId, 'LATE_FEE_APPLIED', `נוספה עמלת פיגור לחשבונית #${invoice.id}.`, ActivitySeverity.WARNING, {
      amount: penaltyAmount,
    });
    return this.mapInvoice(invoice);
  }

  async updateCollections(
    invoiceId: number,
    data: {
      reminderState?: InvoiceReminderState;
      collectionStatus?: CollectionStatus;
      promiseToPayDate?: string | null;
      collectionNotes?: string | null;
      dueDate?: string | null;
    },
    userId?: number,
  ) {
    const invoice = await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        reminderState: data.reminderState,
        collectionStatus: data.collectionStatus,
        promiseToPayDate: data.promiseToPayDate ? new Date(data.promiseToPayDate) : data.promiseToPayDate === null ? null : undefined,
        collectionNotes: data.collectionNotes === undefined ? undefined : data.collectionNotes,
        dueDate: data.dueDate ? new Date(data.dueDate) : data.dueDate === null ? null : undefined,
        lastReminderAt: data.reminderState && data.reminderState !== InvoiceReminderState.NONE ? new Date() : undefined,
      },
      include: this.invoiceInclude,
    });

    await this.logInvoiceActivity(
      invoice,
      userId,
      'COLLECTIONS_UPDATED',
      `סטטוס הגבייה לחשבונית #${invoice.id} עודכן ל-${invoice.collectionStatus}.`,
      invoice.collectionStatus === CollectionStatus.IN_COLLECTIONS ? ActivitySeverity.WARNING : ActivitySeverity.INFO,
      {
        reminderState: invoice.reminderState,
        collectionStatus: invoice.collectionStatus,
        promiseToPayDate: invoice.promiseToPayDate?.toISOString() ?? null,
      },
    );

    return this.mapInvoice(invoice);
  }

  async requestBalanceAdjustment(
    invoiceId: number,
    data: {
      amount: number;
      reason?: string;
      description?: string;
    },
    userId?: number,
  ) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: this.invoiceInclude,
    });
    if (!invoice) {
      throw new BadRequestException('Invoice not found.');
    }
    if (!data.amount || Number.isNaN(Number(data.amount))) {
      throw new BadRequestException('Adjustment amount is required.');
    }

    const task = await this.approvals.createTask({
      type: ApprovalTaskType.RESIDENT_BALANCE_ADJUSTMENT,
      entityType: 'INVOICE',
      entityId: invoice.id,
      buildingId: invoice.resident?.units?.[0]?.buildingId ?? null,
      residentId: invoice.residentId,
      requestedById: userId,
      title: `התאמת יתרה לחשבונית #${invoice.id}`,
      description: data.description ?? this.getInvoiceDescription(invoice.items as any[]),
      reason: data.reason,
      metadata: {
        amount: Number(data.amount),
        invoiceId: invoice.id,
        residentId: invoice.residentId,
        description: data.description ?? null,
      },
    });

    await this.logInvoiceActivity(
      invoice,
      userId,
      'BALANCE_ADJUSTMENT_REQUESTED',
      `נשלחה בקשה להתאמת יתרה לחשבונית #${invoice.id}.`,
      ActivitySeverity.WARNING,
      { approvalTaskId: task.id, amount: Number(data.amount), reason: data.reason ?? null },
    );

    return task;
  }

  async generateReceipt(id: number, actorUserId?: number, actorRole?: Role): Promise<Buffer> {
    const invoice =
      actorRole === Role.RESIDENT
        ? await this.assertResidentOwnsInvoice(id, actorUserId)
        : await this.prisma.invoice.findUniqueOrThrow({ where: { id } });
    return this.receipts.generate(invoice);
  }

  async createRecurringInvoice(
    data: {
      residentId: number;
      title?: string;
      items: any[];
      amount?: number;
      recurrence: string;
      startAt?: string;
      dueDaysAfterIssue?: number;
      graceDays?: number;
      lateFeeAmount?: number;
    },
    userId?: number,
  ) {
    const residentId = await this.resolveResidentId(data.residentId);
    const computedAmount =
      data.amount ??
      data.items.reduce((sum: number, item: any) => sum + Number(item.quantity || 1) * Number(item.unitPrice || item.amount || 0), 0);
    const recurring = await this.prisma.recurringInvoice.create({
      data: {
        resident: { connect: { id: residentId } },
        title: data.title,
        items: data.items,
        amount: computedAmount,
        recurrence: data.recurrence,
        dueDaysAfterIssue: data.dueDaysAfterIssue ?? 30,
        graceDays: data.graceDays ?? 0,
        lateFeeAmount: data.lateFeeAmount ?? 0,
        nextRunAt: data.startAt ? new Date(data.startAt) : new Date(),
      },
      include: {
        resident: {
          include: {
            user: true,
            units: { include: { building: true } },
          },
        },
      },
    });

    await this.activity.log({
      userId,
      residentId: recurring.residentId,
      buildingId: recurring.resident.units[0]?.buildingId ?? null,
      entityType: 'RECURRING_INVOICE',
      entityId: recurring.id,
      action: 'RECURRING_CREATED',
      summary: `נוצר חיוב מחזורי ${recurring.title || this.getInvoiceDescription(recurring.items as any[])}.`,
      metadata: { recurrence: recurring.recurrence, amount: recurring.amount },
    });

    return this.mapRecurring(recurring);
  }

  async listRecurring(residentId?: number) {
    const rows = await this.prisma.recurringInvoice.findMany({
      where: residentId ? { residentId } : {},
      include: {
        resident: {
          include: {
            user: true,
            units: {
              include: {
                building: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => this.mapRecurring(row));
  }

  async toggleRecurring(id: number, active: boolean, userId?: number) {
    const recurring = await this.prisma.recurringInvoice.update({
      where: { id },
      data: {
        active,
        pausedAt: active ? null : new Date(),
      },
      include: {
        resident: {
          include: {
            user: true,
            units: true,
          },
        },
      },
    });

    await this.activity.log({
      userId,
      residentId: recurring.residentId,
      buildingId: recurring.resident.units[0]?.buildingId ?? null,
      entityType: 'RECURRING_INVOICE',
      entityId: recurring.id,
      action: active ? 'RECURRING_RESUMED' : 'RECURRING_PAUSED',
      summary: `חיוב מחזורי #${recurring.id} ${active ? 'הופעל מחדש' : 'הושהה'}.`,
    });

    return this.mapRecurring(recurring);
  }

  private computeNextRun(current: Date, recurrence: string): Date {
    const next = new Date(current);
    const lower = recurrence.toLowerCase();
    if (lower.includes('month')) {
      next.setMonth(next.getMonth() + 1);
    } else if (lower.includes('quarter')) {
      next.setMonth(next.getMonth() + 3);
    } else if (lower.includes('year')) {
      next.setFullYear(next.getFullYear() + 1);
    } else if (lower.includes('week')) {
      next.setDate(next.getDate() + 7);
    } else {
      next.setMonth(next.getMonth() + 1);
    }
    return next;
  }

  async runRecurringNow(id: number, userId?: number) {
    const rec = await this.prisma.recurringInvoice.findUniqueOrThrow({ where: { id } });
    const invoice = await this.createInvoice(
      {
        residentId: rec.residentId,
        items: rec.items as any,
        amount: rec.amount,
        dueDate: this.getDueDate(new Date(), null, rec.dueDaysAfterIssue).toISOString(),
        lateFeeAmount: rec.lateFeeAmount,
      },
      userId,
    );
    await this.prisma.recurringInvoice.update({
      where: { id },
      data: { lastRunAt: new Date(), nextRunAt: this.computeNextRun(new Date(), rec.recurrence) },
    });
    return invoice;
  }

  async runDueRecurring() {
    const now = new Date();
    const due = await this.prisma.recurringInvoice.findMany({ where: { active: true, nextRunAt: { lte: now } } });
    const results: any[] = [];
    for (const rec of due) {
      const invoice = await this.createInvoice({
        residentId: rec.residentId,
        items: rec.items as any,
        amount: rec.amount,
        dueDate: this.getDueDate(now, null, rec.dueDaysAfterIssue).toISOString(),
        lateFeeAmount: rec.lateFeeAmount,
      });
      await this.prisma.recurringInvoice.update({
        where: { id: rec.id },
        data: { lastRunAt: new Date(), nextRunAt: this.computeNextRun(now, rec.recurrence) },
      });
      results.push(invoice);
    }
    return { generated: results.length, invoices: results };
  }
}
