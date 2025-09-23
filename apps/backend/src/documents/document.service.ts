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

  create(dto: CreateDocumentDto) {
    return this.prisma.document.create({
      data: this.mapCreate(dto),
      include: { building: true, unit: true, contract: true, asset: true, expense: true, uploadedBy: true },
    });
  }

  findAll() {
    return this.prisma.document.findMany({
      include: { building: true, unit: true, contract: true, asset: true, expense: true, uploadedBy: true },
      orderBy: { uploadedAt: 'desc' },
    });
  }

  findOne(id: number) {
    return this.prisma.document.findUnique({
      where: { id },
      include: { building: true, unit: true, contract: true, asset: true, expense: true, uploadedBy: true },
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
}
