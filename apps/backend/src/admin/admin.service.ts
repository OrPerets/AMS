import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ApprovalTaskStatus, ActivitySeverity, CollectionStatus, InvoiceStatus, Role as PrismaRole, TicketStatus } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { Role } from '../auth/roles.decorator';
import { ImpersonateDto } from './dto/impersonate.dto';
import { ActivityService } from '../activity/activity.service';
import { ApprovalService } from '../approval/approval.service';
import { existsSync } from 'fs';
import { join } from 'path';

@Injectable()
export class AdminService {
  constructor(
    private jwt: JwtService,
    private prisma: PrismaService,
    private activityLog: ActivityService,
    private approvals: ApprovalService,
  ) {}

  async overview() {
    const [
      openTickets,
      unpaidInvoices,
      users,
      buildings,
      recentImpersonationEvents,
      recentNotifications,
      userRoleCounts,
      recentActivity,
      escalatedCollections,
      expiringSupplierCompliance,
      pendingApprovalTasks,
    ] =
      await Promise.all([
        this.prisma.ticket.count({ where: { status: { not: TicketStatus.RESOLVED } } }),
        this.prisma.invoice.count({ where: { status: InvoiceStatus.UNPAID } }),
        this.prisma.user.findMany({
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            email: true,
            role: true,
            tenantId: true,
            phone: true,
            createdAt: true,
          },
          take: 12,
        }),
        this.prisma.building.count(),
        this.prisma.impersonationEvent.findMany({
          orderBy: { createdAt: 'desc' },
          take: 8,
        }),
        this.prisma.notification.findMany({
          orderBy: { createdAt: 'desc' },
          take: 8,
          select: {
            id: true,
            title: true,
            message: true,
            type: true,
            userId: true,
            buildingId: true,
            createdAt: true,
            read: true,
          },
        }),
        this.prisma.user.groupBy({
          by: ['role'],
          _count: { _all: true },
        }),
        this.activityLog.list({ limit: 12 }),
        this.prisma.invoice.count({
          where: {
            status: InvoiceStatus.UNPAID,
            collectionStatus: CollectionStatus.IN_COLLECTIONS,
          },
        }),
        this.prisma.supplier.count({
          where: {
            isActive: true,
            insuranceExpiry: {
              lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
          },
        }),
        this.prisma.approvalTask.count({
          where: { status: ApprovalTaskStatus.PENDING },
        }),
      ]);

    const roleCounts = Object.values(PrismaRole).reduce(
      (acc, roleName) => ({ ...acc, [roleName]: 0 }),
      {} as Record<string, number>,
    );
    for (const entry of userRoleCounts) {
      roleCounts[entry.role] = entry._count._all;
    }

    return {
      stats: {
        totalUsers: await this.prisma.user.count(),
        totalBuildings: buildings,
        openTickets,
        unpaidInvoices,
        activeTechs: await this.prisma.user.count({ where: { role: PrismaRole.TECH } }),
      },
      health: {
        database: 'connected',
        auth: 'healthy',
        notifications: 'healthy',
      },
      roleCounts,
      users,
      recentImpersonationEvents,
      recentNotifications,
      navigation: [
        { label: 'התראות מנהל', href: '/admin/notifications' },
        { label: 'חשבוניות ממתינות', href: '/admin/unpaid-invoices' },
        { label: 'יומן פעילות', href: '/admin/activity' },
        { label: 'מרכז אישורים', href: '/admin/approvals' },
        { label: 'איכות נתונים', href: '/admin/data-quality' },
        { label: 'הגדרות משתמש', href: '/settings' },
      ],
      exceptions: {
        escalatedCollections,
        expiringSupplierCompliance,
        pendingApprovalTasks,
      },
      recentActivity,
    };
  }

  activity(input: { buildingId?: number; severity?: string; entityType?: string }) {
    return this.activityLog.list({
      buildingId: input.buildingId,
      severity: input.severity as ActivitySeverity | undefined,
      entityType: input.entityType,
      limit: 200,
    });
  }

  exportActivity(input: { buildingId?: number }) {
    return this.activityLog.exportCsv({ buildingId: input.buildingId, limit: 500 });
  }

  approvalsList(input: { buildingId?: number; status?: ApprovalTaskStatus | string }) {
    return this.approvals.list({
      buildingId: input.buildingId,
      status: input.status as ApprovalTaskStatus | undefined,
    });
  }

  approveTask(taskId: number, decidedById: number, actorRole: PrismaRole, comment?: string) {
    return this.approvals.approve(taskId, decidedById, actorRole, comment);
  }

  rejectTask(taskId: number, decidedById: number, actorRole: PrismaRole, comment?: string) {
    return this.approvals.reject(taskId, decidedById, actorRole, comment);
  }

  async dataQuality() {
    const uploadsDir = join(__dirname, '..', '..', 'uploads');
    const [buildings, units, residents, suppliers, contracts, documents] = await Promise.all([
      this.prisma.building.findMany({
        select: {
          id: true,
          name: true,
          address: true,
          managerName: true,
          contactEmail: true,
          contactPhone: true,
          totalUnits: true,
          floors: true,
          isActive: true,
          _count: { select: { units: true } },
        },
      }),
      this.prisma.unit.findMany({
        select: {
          id: true,
          number: true,
          buildingId: true,
          area: true,
          floor: true,
          isActive: true,
          _count: { select: { residents: true } },
        },
      }),
      this.prisma.resident.findMany({
        include: {
          user: { select: { id: true, email: true, phone: true } },
          units: { select: { id: true, number: true, buildingId: true } },
        },
      }),
      this.prisma.supplier.findMany({
        select: {
          id: true,
          name: true,
          contactName: true,
          email: true,
          phone: true,
          insuranceExpiry: true,
          documents: true,
          isActive: true,
        },
      }),
      this.prisma.contract.findMany({
        select: {
          id: true,
          title: true,
          supplierId: true,
          ownerUserId: true,
          endDate: true,
          approvalStatus: true,
        },
      }),
      this.prisma.document.findMany({
        select: { id: true, name: true, url: true, buildingId: true, unitId: true, contractId: true, assetId: true, expenseId: true },
      }),
    ]);

    const duplicateResidentPhones = new Map<string, typeof residents>();
    for (const resident of residents) {
      const phone = resident.user.phone?.trim();
      if (!phone) continue;
      const list = duplicateResidentPhones.get(phone) ?? [];
      list.push(resident);
      duplicateResidentPhones.set(phone, list);
    }

    const duplicateSupplierContacts = new Map<string, typeof suppliers>();
    for (const supplier of suppliers) {
      const keys = [supplier.email?.trim().toLowerCase(), supplier.phone?.trim()].filter(Boolean) as string[];
      for (const key of keys) {
        const list = duplicateSupplierContacts.get(key) ?? [];
        list.push(supplier);
        duplicateSupplierContacts.set(key, list);
      }
    }

    const duplicateUnits = new Map<string, typeof units>();
    for (const unit of units) {
      const key = `${unit.buildingId}:${unit.number.trim().toLowerCase()}`;
      const list = duplicateUnits.get(key) ?? [];
      list.push(unit);
      duplicateUnits.set(key, list);
    }

    const invalidDocumentLinks = documents.filter((document) => {
      if (!document.url?.trim()) return true;
      if (!document.buildingId && !document.unitId && !document.contractId && !document.assetId && !document.expenseId) return true;
      if (!document.url.startsWith('/uploads/')) return false;
      const filePath = join(uploadsDir, document.url.replace('/uploads/', ''));
      return !existsSync(filePath);
    });

    const incompleteBuildings = buildings
      .map((building) => ({
        ...building,
        missing: [
          !building.managerName ? 'managerName' : null,
          !building.contactEmail ? 'contactEmail' : null,
          !building.contactPhone ? 'contactPhone' : null,
          !building.floors ? 'floors' : null,
          !building.totalUnits ? 'totalUnits' : null,
        ].filter(Boolean),
      }))
      .filter((building) => building.missing.length > 0);

    const incompleteUnits = units
      .map((unit) => ({
        ...unit,
        missing: [unit.floor === null || unit.floor === undefined ? 'floor' : null, !unit.area ? 'area' : null].filter(Boolean),
      }))
      .filter((unit) => unit.missing.length > 0);

    const incompleteSuppliers = suppliers
      .map((supplier) => ({
        ...supplier,
        missing: [
          !supplier.contactName ? 'contactName' : null,
          !supplier.email ? 'email' : null,
          !supplier.phone ? 'phone' : null,
          !supplier.insuranceExpiry ? 'insuranceExpiry' : null,
          !supplier.documents?.length ? 'documents' : null,
        ].filter(Boolean),
      }))
      .filter((supplier) => supplier.missing.length > 0);

    const incompleteContracts = contracts
      .map((contract) => ({
        ...contract,
        missing: [
          !contract.supplierId ? 'supplierId' : null,
          !contract.ownerUserId ? 'ownerUserId' : null,
          !contract.endDate ? 'endDate' : null,
          !contract.approvalStatus ? 'approvalStatus' : null,
        ].filter(Boolean),
      }))
      .filter((contract) => contract.missing.length > 0);

    return {
      summary: {
        duplicateResidents: Array.from(duplicateResidentPhones.values()).filter((group) => group.length > 1).length,
        duplicateSuppliers: Array.from(duplicateSupplierContacts.values()).filter((group) => group.length > 1).length,
        duplicateUnits: Array.from(duplicateUnits.values()).filter((group) => group.length > 1).length,
        incompleteBuildings: incompleteBuildings.length,
        incompleteUnits: incompleteUnits.length,
        incompleteSuppliers: incompleteSuppliers.length,
        incompleteContracts: incompleteContracts.length,
        inactiveBuildings: buildings.filter((building) => !building.isActive).length,
        inactiveUnits: units.filter((unit) => !unit.isActive).length,
        invalidDocumentLinks: invalidDocumentLinks.length,
      },
      duplicates: {
        residentPhones: Array.from(duplicateResidentPhones.entries())
          .filter(([, group]) => group.length > 1)
          .map(([phone, group]) => ({
            key: phone,
            entries: group.map((resident) => ({
              residentId: resident.id,
              userId: resident.userId,
              email: resident.user.email,
              units: resident.units.map((unit) => `${unit.buildingId}/${unit.number}`),
            })),
          })),
        supplierContacts: Array.from(duplicateSupplierContacts.entries())
          .filter(([, group]) => group.length > 1)
          .map(([key, group]) => ({
            key,
            entries: group.map((supplier) => ({
              supplierId: supplier.id,
              name: supplier.name,
              email: supplier.email,
              phone: supplier.phone,
            })),
          })),
        unitNumbers: Array.from(duplicateUnits.entries())
          .filter(([, group]) => group.length > 1)
          .map(([key, group]) => ({
            key,
            entries: group.map((unit) => ({
              unitId: unit.id,
              buildingId: unit.buildingId,
              number: unit.number,
            })),
          })),
      },
      completeness: {
        buildings: incompleteBuildings,
        units: incompleteUnits,
        suppliers: incompleteSuppliers,
        contracts: incompleteContracts,
      },
      warnings: {
        inactiveBuildings: buildings.filter((building) => !building.isActive),
        inactiveUnits: units.filter((unit) => !unit.isActive),
        buildingsWithoutUnits: buildings.filter((building) => building._count.units === 0),
        unitsWithoutResidents: units.filter((unit) => unit._count.residents === 0),
        invalidDocumentLinks,
      },
    };
  }

  async impersonate(user: any, dto: ImpersonateDto, ip: string, userAgent: string) {
    if (dto.role === Role.MASTER || !Object.values(Role).includes(dto.role)) {
      throw new BadRequestException('Invalid role');
    }
    const payload = {
      sub: user.sub,
      email: user.email,
      role: user.role,
      actAsRole: dto.role,
      tenantId: dto.tenantId,
    };
    const accessToken = await this.jwt.signAsync(payload, {
      secret: process.env.JWT_SECRET || 'secret',
      expiresIn: '30m',
    });
    const refreshToken = await this.jwt.signAsync(payload, {
      secret: process.env.JWT_REFRESH_SECRET || 'refresh_secret',
      expiresIn: '30m',
    });
    await this.prisma.impersonationEvent.create({
      data: {
        masterUserId: user.sub,
        action: 'START',
        targetRole: dto.role,
        tenantId: dto.tenantId,
        reason: dto.reason,
        ip,
        userAgent,
      },
    });
    await this.activityLog.log({
      userId: user.sub,
      entityType: 'IMPERSONATION',
      action: 'START',
      summary: `התחזות הופעלה לתפקיד ${dto.role}.`,
      severity: ActivitySeverity.WARNING,
      metadata: { tenantId: dto.tenantId, reason: dto.reason },
    });
    return { accessToken, refreshToken };
  }

  async stopImpersonation(user: any, ip: string, userAgent: string) {
    const payload = {
      sub: user.sub,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    };
    const accessToken = await this.jwt.signAsync(payload, {
      secret: process.env.JWT_SECRET || 'secret',
      expiresIn: '15m',
    });
    const refreshToken = await this.jwt.signAsync(payload, {
      secret: process.env.JWT_REFRESH_SECRET || 'refresh_secret',
      expiresIn: '7d',
    });
    await this.prisma.impersonationEvent.create({
      data: {
        masterUserId: user.sub,
        action: 'STOP',
        targetRole: user.actAsRole,
        tenantId: user.tenantId,
        ip,
        userAgent,
      },
    });
    await this.activityLog.log({
      userId: user.sub,
      entityType: 'IMPERSONATION',
      action: 'STOP',
      summary: 'התחזות הופסקה וחזרה לחשבון הראשי.',
      severity: ActivitySeverity.INFO,
      metadata: { tenantId: user.tenantId },
    });
    return { accessToken, refreshToken };
  }
}
