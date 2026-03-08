import { BadRequestException, Injectable } from '@nestjs/common';
import {
  ActivitySeverity,
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

type InvoiceWithRelations = Prisma.InvoiceGetPayload<{
  include: {
    resident: { include: { user: true; units: { include: { building: true } } } };
    paymentIntents: { include: { paymentMethod: true; refunds: true } };
    ledgerEntries: true;
  };
}>;

@Injectable()
export class PaymentService {
  constructor(
    private prisma: PrismaService,
    private receipts: ReceiptService,
    private tranzilaProvider: TranzilaProvider,
    private activity: ActivityService,
  ) {}

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

  listUnpaid(residentId?: number) {
    return this.prisma.invoice
      .findMany({
        where: {
          status: InvoiceStatus.UNPAID,
          ...(residentId ? { residentId } : {}),
        },
        include: this.invoiceInclude,
        orderBy: { createdAt: 'desc' },
      })
      .then((invoices) => invoices.map((invoice) => this.mapInvoice(invoice)));
  }

  listInvoices(residentId?: number, status?: 'PENDING' | 'PAID' | 'OVERDUE') {
    return this.prisma.invoice
      .findMany({
        where: {
          ...(residentId ? { residentId } : {}),
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

  async initiatePayment(id: number) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: { resident: { include: { user: true } } },
    });
    if (!invoice) throw new Error('Invoice not found');

    const intent = await this.prisma.paymentIntent.create({
      data: {
        invoiceId: invoice.id,
        amount: invoice.amount,
        currency: 'NIS',
        status: PaymentIntentStatus.REQUIRES_CONFIRMATION,
        provider: 'tranzila',
      },
    });
    const result = await this.tranzilaProvider.createPayment({
      amount: invoice.amount,
      currency: 'NIS',
      description: `Invoice #${invoice.id}`,
    });
    await this.prisma.paymentIntent.update({
      where: { id: intent.id },
      data: { providerIntentId: result.providerIntentId || String(intent.id), clientSecret: result.clientSecret || null },
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

    const invoice = await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: InvoiceStatus.PAID,
        collectionStatus: CollectionStatus.RESOLVED,
        reminderState: InvoiceReminderState.PROMISED,
      },
      include: this.invoiceInclude,
    });
    const latestIntent = invoice.paymentIntents[0];
    if (latestIntent) {
      await this.prisma.paymentIntent.update({
        where: { id: latestIntent.id },
        data: { status: PaymentIntentStatus.SUCCEEDED },
      });
    }
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
    const intent = await this.prisma.paymentIntent.create({
      data: {
        invoiceId: invoice.id,
        amount: invoice.amount,
        currency: 'NIS',
        status: PaymentIntentStatus.REQUIRES_CONFIRMATION,
        provider: 'tranzila',
      },
    });
    const result = await this.tranzilaProvider.createPayment({
      amount: invoice.amount,
      currency: 'NIS',
      description: `Invoice #${invoice.id}`,
    });
    await this.prisma.paymentIntent.update({
      where: { id: intent.id },
      data: { providerIntentId: result.providerIntentId || String(intent.id), clientSecret: result.clientSecret || null },
    });
    return { id: intent.id, status: intent.status, redirectUrl: result.redirectUrl, clientSecret: result.clientSecret };
  }

  async refund(paymentIntentId: number, amount?: number) {
    const intent = await this.prisma.paymentIntent.findUniqueOrThrow({
      where: { id: paymentIntentId },
      include: { invoice: true },
    });
    const res = await this.tranzilaProvider.refund({ providerIntentId: intent.providerIntentId || String(intent.id), amount });
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

  async getPayment(paymentIntentId: number) {
    return this.prisma.paymentIntent.findUniqueOrThrow({ where: { id: paymentIntentId } });
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

  async generateReceipt(id: number): Promise<Buffer> {
    const invoice = await this.prisma.invoice.findUniqueOrThrow({ where: { id } });
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
