import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class WorkOrderService {
  constructor(private prisma: PrismaService) {}

  listTodayForSupplier(supplierId: number) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    return this.prisma.workOrder.findMany({
      where: {
        supplierId,
        createdAt: { gte: start, lte: end },
      },
      include: { ticket: true },
    });
  }
}
