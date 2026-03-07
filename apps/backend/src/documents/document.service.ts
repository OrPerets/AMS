import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class DocumentService {
  constructor(private prisma: PrismaService) {}

  private mapCreate(dto: CreateDocumentDto): Prisma.DocumentCreateInput {
    const { buildingId, unitId, contractId, assetId, expenseId, uploadedById, ...rest } = dto;
    return {
      ...rest,
      building: buildingId ? { connect: { id: buildingId } } : undefined,
      unit: unitId ? { connect: { id: unitId } } : undefined,
      contract: contractId ? { connect: { id: contractId } } : undefined,
      asset: assetId ? { connect: { id: assetId } } : undefined,
      expense: expenseId ? { connect: { id: expenseId } } : undefined,
      uploadedBy: uploadedById ? { connect: { id: uploadedById } } : undefined,
    };
  }

  private mapUpdate(dto: UpdateDocumentDto): Prisma.DocumentUpdateInput {
    const { buildingId, unitId, contractId, assetId, expenseId, uploadedById, ...rest } = dto;
    return {
      ...rest,
      building: buildingId ? { connect: { id: buildingId } } : undefined,
      unit: unitId ? { connect: { id: unitId } } : undefined,
      contract: contractId ? { connect: { id: contractId } } : undefined,
      asset: assetId ? { connect: { id: assetId } } : undefined,
      expense: expenseId ? { connect: { id: expenseId } } : undefined,
      uploadedBy: uploadedById ? { connect: { id: uploadedById } } : undefined,
    };
  }

  create(dto: CreateDocumentDto & { fileSize?: number; mimeType?: string }) {
    return this.prisma.document.create({
      data: this.mapCreate(dto),
      include: { building: true, unit: true, contract: true, asset: true, expense: true, uploadedBy: true },
    });
  }

  findAll(opts?: { search?: string; type?: string; buildingId?: number }) {
    const where: Prisma.DocumentWhereInput = {};
    if (opts?.search) {
      where.OR = [
        { name: { contains: opts.search, mode: 'insensitive' } },
        { category: { contains: opts.search, mode: 'insensitive' } },
        { tags: { has: opts.search } },
        { description: { contains: opts.search, mode: 'insensitive' } },
      ];
    }
    if (opts?.type && opts.type !== 'all') {
      where.category = { equals: opts.type, mode: 'insensitive' } as any;
    }
    if (opts?.buildingId) where.buildingId = opts.buildingId;

    return this.prisma.document.findMany({
      where,
      include: { building: true, unit: true, contract: true, asset: true, expense: true, uploadedBy: true },
      orderBy: { uploadedAt: 'desc' },
    });
  }

  findOne(id: number) {
    return this.prisma.document.findUnique({
      where: { id },
      include: {
        building: true,
        unit: true,
        contract: true,
        asset: true,
        expense: true,
        uploadedBy: true,
        parent: true,
        versions: {
          orderBy: { version: 'desc' },
        },
        sharedWith: {
          include: { user: true },
          orderBy: { sharedAt: 'desc' },
        },
      },
    });
  }

  findForBuilding(buildingId: number) {
    return this.prisma.document.findMany({
      where: { buildingId },
      orderBy: { uploadedAt: 'desc' },
      include: { unit: true, contract: true, asset: true, expense: true, uploadedBy: true },
    });
  }

  findForUnit(unitId: number) {
    return this.prisma.document.findMany({
      where: { unitId },
      orderBy: { uploadedAt: 'desc' },
      include: { building: true, uploadedBy: true },
    });
  }

  findForAsset(assetId: number) {
    return this.prisma.document.findMany({
      where: { assetId },
      orderBy: { uploadedAt: 'desc' },
      include: { building: true, uploadedBy: true },
    });
  }

  findForContract(contractId: number) {
    return this.prisma.document.findMany({
      where: { contractId },
      orderBy: { uploadedAt: 'desc' },
      include: { building: true, uploadedBy: true },
    });
  }

  findForExpense(expenseId: number) {
    return this.prisma.document.findMany({
      where: { expenseId },
      orderBy: { uploadedAt: 'desc' },
      include: { building: true, uploadedBy: true },
    });
  }

  update(id: number, dto: UpdateDocumentDto) {
    return this.prisma.document.update({
      where: { id },
      data: this.mapUpdate(dto),
      include: { building: true, unit: true, contract: true, asset: true, expense: true, uploadedBy: true },
    });
  }

  remove(id: number) {
    return this.prisma.document.delete({ where: { id } });
  }

  share(documentId: number, input: { userId: number; permission?: string; expiresAt?: string }) {
    return this.prisma.documentShare.upsert({
      where: { documentId_userId: { documentId, userId: input.userId } },
      update: { permission: input.permission as any, expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined },
      create: { documentId, userId: input.userId, permission: (input.permission as any) ?? 'VIEW', expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined },
    });
  }

  listShares(documentId: number) {
    return this.prisma.documentShare.findMany({ where: { documentId }, include: { user: true } });
  }

  async createVersion(parentId: number, dto: Partial<UpdateDocumentDto> & { url: string; name?: string }) {
    // Mark previous latest as not latest
    await this.prisma.document.updateMany({ where: { id: parentId }, data: { isLatest: false } });

    const parent = await this.prisma.document.findUnique({ where: { id: parentId } });
    if (!parent) throw new Error('Parent document not found');

    const nextVersion = (parent.version ?? 1) + 1;
    return this.prisma.document.create({
      data: {
        name: dto.name ?? parent.name,
        url: dto.url,
        category: dto.category ?? parent.category,
        description: dto['description' as keyof typeof dto] as any,
        tags: (dto['tags' as keyof typeof dto] as any) ?? (parent as any).tags,
        fileSize: (dto as any).fileSize,
        mimeType: (dto as any).mimeType,
        version: nextVersion,
        isLatest: true,
        parent: { connect: { id: parentId } },
        building: parent.buildingId ? { connect: { id: parent.buildingId } } : undefined,
        unit: parent.unitId ? { connect: { id: parent.unitId } } : undefined,
        contract: parent.contractId ? { connect: { id: parent.contractId } } : undefined,
        asset: parent.assetId ? { connect: { id: parent.assetId } } : undefined,
        expense: parent.expenseId ? { connect: { id: parent.expenseId } } : undefined,
        uploadedBy: parent.uploadedById ? { connect: { id: parent.uploadedById } } : undefined,
      },
    });
  }
}
