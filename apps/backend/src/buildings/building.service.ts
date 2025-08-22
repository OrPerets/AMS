import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Prisma, Building } from '@prisma/client';

@Injectable()
export class BuildingService {
  constructor(private prisma: PrismaService) {}

  create(data: Prisma.BuildingCreateInput): Promise<Building> {
    return this.prisma.building.create({ data });
  }

  findAll(): Promise<Building[]> {
    return this.prisma.building.findMany();
  }

  findOne(id: number): Promise<Building | null> {
    return this.prisma.building.findUnique({ where: { id } });
  }

  update(id: number, data: Prisma.BuildingUpdateInput): Promise<Building> {
    return this.prisma.building.update({ where: { id }, data });
  }

  remove(id: number): Promise<Building> {
    return this.prisma.building.delete({ where: { id } });
  }
}
