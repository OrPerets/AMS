import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Prisma, Unit } from '@prisma/client';

@Injectable()
export class UnitService {
  constructor(private prisma: PrismaService) {}

  private readonly include = {
    building: true,
    residents: {
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    },
    assets: {
      include: {
        building: true,
      },
      orderBy: { name: 'asc' as const },
    },
  };

  create(data: Prisma.UnitCreateInput, residentIds?: number[]): Promise<Unit> {
    return this.prisma.unit.create({
      data: {
        ...data,
        residents: residentIds
          ? { connect: residentIds.map((id) => ({ id })) }
          : undefined,
      },
      include: this.include,
    });
  }

  findAll(buildingId?: number): Promise<Unit[]> {
    return this.prisma.unit.findMany({
      where: buildingId ? { buildingId } : undefined,
      include: this.include,
      orderBy: [{ buildingId: 'asc' }, { number: 'asc' }],
    });
  }

  findOne(id: number): Promise<Unit | null> {
    return this.prisma.unit.findUnique({
      where: { id },
      include: this.include,
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
      include: this.include,
    });
  }

  remove(id: number): Promise<Unit> {
    return this.prisma.unit.delete({ where: { id } });
  }
}
