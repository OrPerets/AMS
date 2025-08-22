import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Prisma, Unit } from '@prisma/client';

@Injectable()
export class UnitService {
  constructor(private prisma: PrismaService) {}

  create(data: Prisma.UnitCreateInput, residentIds?: number[]): Promise<Unit> {
    return this.prisma.unit.create({
      data: {
        ...data,
        residents: residentIds
          ? { connect: residentIds.map((id) => ({ id })) }
          : undefined,
      },
    });
  }

  findAll(): Promise<Unit[]> {
    return this.prisma.unit.findMany({ include: { residents: true } });
  }

  findOne(id: number): Promise<Unit | null> {
    return this.prisma.unit.findUnique({
      where: { id },
      include: { residents: true },
    });
  }

  update(id: number, data: Prisma.UnitUpdateInput, residentIds?: number[]): Promise<Unit> {
    return this.prisma.unit.update({
      where: { id },
      data: {
        ...data,
        residents: residentIds
          ? { set: residentIds.map((id) => ({ id })) }
          : undefined,
      },
      include: { residents: true },
    });
  }

  remove(id: number): Promise<Unit> {
    return this.prisma.unit.delete({ where: { id } });
  }
}
