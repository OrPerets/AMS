import { Injectable } from '@nestjs/common';
import { ActivityService } from '../activity/activity.service';
import { PrismaService } from '../prisma.service';

@Injectable()
export class VendorsService {
  constructor(
    private prisma: PrismaService,
    private activity: ActivityService,
  ) {}

  listVendors() {
    return this.prisma.supplier.findMany({
      include: {
        user: true,
        contracts: {
          include: {
            building: true,
          },
          orderBy: { endDate: 'asc' },
        },
        workOrders: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
    });
  }

  async exportVendorsCsv() {
    const vendors = await this.listVendors();
    return [
      ['vendorId', 'name', 'contactName', 'email', 'phone', 'skills', 'rating', 'insuranceExpiry', 'complianceDocumentExpiry', 'isActive'].join(','),
      ...vendors.map((vendor) =>
        [
          vendor.id,
          JSON.stringify(vendor.name),
          JSON.stringify(vendor.contactName ?? ''),
          JSON.stringify(vendor.email ?? ''),
          JSON.stringify(vendor.phone ?? ''),
          JSON.stringify(vendor.skills.join('; ')),
          vendor.rating ?? '',
          vendor.insuranceExpiry?.toISOString() ?? '',
          vendor.complianceDocumentExpiry?.toISOString() ?? '',
          vendor.isActive,
        ].join(','),
      ),
    ].join('\n');
  }

  async createVendor(input: {
    name: string;
    skills?: string[];
    contactName?: string;
    email?: string;
    phone?: string;
    insuranceExpiry?: string;
    complianceDocumentExpiry?: string;
    complianceNotes?: string;
    rating?: number;
  }, userId?: number) {
    const vendor = await this.prisma.supplier.create({
      data: {
        name: input.name,
        skills: input.skills ?? [],
        contactName: input.contactName,
        email: input.email,
        phone: input.phone,
        insuranceExpiry: input.insuranceExpiry ? new Date(input.insuranceExpiry) : undefined,
        complianceDocumentExpiry: input.complianceDocumentExpiry ? new Date(input.complianceDocumentExpiry) : undefined,
        complianceNotes: input.complianceNotes,
        rating: input.rating,
      },
    });
    await this.activity.log({
      userId,
      entityType: 'VENDOR',
      entityId: vendor.id,
      action: 'VENDOR_CREATED',
      summary: `נוצר ספק חדש: ${vendor.name}.`,
    });
    return vendor;
  }

  async updateVendor(id: number, input: {
    name?: string;
    skills?: string[];
    contactName?: string | null;
    email?: string | null;
    phone?: string | null;
    isActive?: boolean;
    insuranceExpiry?: string | null;
    complianceDocumentExpiry?: string | null;
    complianceNotes?: string | null;
    rating?: number | null;
  }, userId?: number) {
    const vendor = await this.prisma.supplier.update({
      where: { id },
      data: {
        name: input.name,
        skills: input.skills,
        contactName: input.contactName === undefined ? undefined : input.contactName,
        email: input.email === undefined ? undefined : input.email,
        phone: input.phone === undefined ? undefined : input.phone,
        isActive: input.isActive,
        insuranceExpiry: input.insuranceExpiry ? new Date(input.insuranceExpiry) : input.insuranceExpiry === null ? null : undefined,
        complianceDocumentExpiry: input.complianceDocumentExpiry ? new Date(input.complianceDocumentExpiry) : input.complianceDocumentExpiry === null ? null : undefined,
        complianceNotes: input.complianceNotes === undefined ? undefined : input.complianceNotes,
        rating: input.rating === undefined ? undefined : input.rating,
      },
    });
    await this.activity.log({
      userId,
      entityType: 'VENDOR',
      entityId: vendor.id,
      action: 'VENDOR_UPDATED',
      summary: `עודכן ספק: ${vendor.name}.`,
    });
    return vendor;
  }

  listContracts() {
    return this.prisma.contract.findMany({
      include: {
        building: true,
        supplier: true,
        owner: {
          select: {
            id: true,
            email: true,
          },
        },
        documents: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [{ endDate: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async exportContractsCsv() {
    const contracts = await this.listContracts();
    return [
      ['contractId', 'title', 'buildingName', 'supplierName', 'ownerEmail', 'value', 'status', 'approvalStatus', 'startDate', 'endDate', 'renewalReminderDays'].join(','),
      ...contracts.map((contract) =>
        [
          contract.id,
          JSON.stringify(contract.title),
          JSON.stringify(contract.building.name),
          JSON.stringify(contract.supplier?.name ?? ''),
          JSON.stringify(contract.owner?.email ?? ''),
          contract.value ?? '',
          JSON.stringify(contract.status),
          JSON.stringify(contract.approvalStatus),
          contract.startDate.toISOString(),
          contract.endDate?.toISOString() ?? '',
          contract.renewalReminderDays,
        ].join(','),
      ),
    ].join('\n');
  }

  async createContract(input: {
    buildingId: number;
    supplierId?: number | null;
    ownerUserId?: number | null;
    title: string;
    description?: string;
    value?: number;
    startDate: string;
    endDate?: string | null;
    status?: string;
    renewalReminderDays?: number;
    approvalStatus?: string;
  }, userId?: number) {
    const contract = await this.prisma.contract.create({
      data: {
        buildingId: input.buildingId,
        supplierId: input.supplierId ?? undefined,
        ownerUserId: input.ownerUserId ?? undefined,
        title: input.title,
        description: input.description,
        value: input.value,
        startDate: new Date(input.startDate),
        endDate: input.endDate ? new Date(input.endDate) : undefined,
        status: input.status ?? 'ACTIVE',
        renewalReminderDays: input.renewalReminderDays ?? 30,
        approvalStatus: input.approvalStatus ?? 'APPROVED',
        approvedAt: (input.approvalStatus ?? 'APPROVED') === 'APPROVED' ? new Date() : undefined,
      },
      include: {
        building: true,
        supplier: true,
        owner: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });
    await this.activity.log({
      userId,
      buildingId: contract.buildingId,
      entityType: 'CONTRACT',
      entityId: contract.id,
      action: 'CONTRACT_CREATED',
      summary: `נוצר חוזה חדש: ${contract.title}.`,
    });
    return contract;
  }

  async updateContract(id: number, input: {
    buildingId?: number;
    supplierId?: number | null;
    ownerUserId?: number | null;
    title?: string;
    description?: string | null;
    value?: number | null;
    startDate?: string;
    endDate?: string | null;
    status?: string;
    renewalReminderDays?: number;
    approvalStatus?: string;
  }, userId?: number) {
    const contract = await this.prisma.contract.update({
      where: { id },
      data: {
        buildingId: input.buildingId,
        supplierId: input.supplierId === undefined ? undefined : input.supplierId,
        ownerUserId: input.ownerUserId === undefined ? undefined : input.ownerUserId,
        title: input.title,
        description: input.description === undefined ? undefined : input.description,
        value: input.value === undefined ? undefined : input.value,
        startDate: input.startDate ? new Date(input.startDate) : undefined,
        endDate: input.endDate ? new Date(input.endDate) : input.endDate === null ? null : undefined,
        status: input.status,
        renewalReminderDays: input.renewalReminderDays,
        approvalStatus: input.approvalStatus,
        approvedAt: input.approvalStatus === 'APPROVED' ? new Date() : undefined,
      },
      include: {
        building: true,
        supplier: true,
        owner: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });
    await this.activity.log({
      userId,
      buildingId: contract.buildingId,
      entityType: 'CONTRACT',
      entityId: contract.id,
      action: 'CONTRACT_UPDATED',
      summary: `עודכן חוזה: ${contract.title}.`,
    });
    return contract;
  }

  async runPortfolioReminders(userId?: number) {
    const now = new Date();
    const reminderHorizon = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const [suppliers, contracts, managers] = await Promise.all([
      this.prisma.supplier.findMany({
        where: {
          isActive: true,
          OR: [
            { insuranceExpiry: { lte: reminderHorizon, gte: now } },
            { complianceDocumentExpiry: { lte: reminderHorizon, gte: now } },
          ],
        },
      }),
      this.prisma.contract.findMany({
        where: {
          status: 'ACTIVE',
          endDate: { not: null },
        },
        include: {
          building: true,
          owner: true,
          supplier: true,
        },
      }),
      this.prisma.user.findMany({
        where: { role: { in: ['ADMIN', 'PM', 'ACCOUNTANT'] } },
        select: { id: true, tenantId: true },
      }),
    ]);

    const expiringContracts = contracts.filter((contract) => {
      if (!contract.endDate) return false;
      const reminderDate = new Date(contract.endDate.getTime() - contract.renewalReminderDays * 24 * 60 * 60 * 1000);
      return reminderDate <= now || contract.endDate < now;
    });

    const notifications = await Promise.all([
      ...suppliers.flatMap((supplier) =>
        managers.map((manager) =>
          this.prisma.notification.create({
            data: {
              tenantId: manager.tenantId,
              userId: manager.id,
              title: `תזכורת תאימות ספק: ${supplier.name}`,
              message: 'נדרש לעדכן ביטוח או מסמך תאימות בקרוב.',
              type: 'VENDOR_COMPLIANCE_REMINDER',
              metadata: { supplierId: supplier.id },
            },
          }),
        ),
      ),
      ...expiringContracts.flatMap((contract) =>
        managers.map((manager) =>
          this.prisma.notification.create({
            data: {
              tenantId: manager.tenantId,
              userId: manager.id,
              buildingId: contract.buildingId,
              title: `תזכורת חידוש חוזה: ${contract.title}`,
              message: contract.endDate && contract.endDate < now ? 'החוזה עבר את מועד הסיום ודורש טיפול.' : 'החוזה קרוב למועד חידוש.',
              type: 'CONTRACT_RENEWAL_REMINDER',
              metadata: { contractId: contract.id, endDate: contract.endDate?.toISOString() ?? null },
            },
          }),
        ),
      ),
    ]);

    await Promise.all([
      ...suppliers.map((supplier) =>
        this.prisma.supplier.update({
          where: { id: supplier.id },
          data: { lastComplianceReminderAt: now },
        }),
      ),
      ...expiringContracts.map((contract) =>
        this.prisma.contract.update({
          where: { id: contract.id },
          data: { lastRenewalReminderAt: now },
        }),
      ),
    ]);

    await this.activity.log({
      userId,
      entityType: 'PORTFOLIO_REMINDERS',
      action: 'REMINDERS_RUN',
      summary: `נשלחו ${notifications.length} תזכורות חידוש ותאימות.`,
      metadata: { supplierCount: suppliers.length, contractCount: expiringContracts.length },
    });

    return {
      supplierReminders: suppliers.length,
      contractReminders: expiringContracts.length,
      notificationsSent: notifications.length,
    };
  }
}
