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

  async createVendor(input: {
    name: string;
    skills?: string[];
    contactName?: string;
    email?: string;
    phone?: string;
    insuranceExpiry?: string;
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
}
