import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Prisma, TicketStatus, Ticket } from '@prisma/client';
import { PhotoService } from './photo.service';
import { NotificationService } from '../notifications/notification.service';

@Injectable()
export class TicketService {
  constructor(
    private prisma: PrismaService,
    private photos: PhotoService,
    private notifications: NotificationService,
  ) {}

  async create(data: Prisma.TicketCreateInput, files: Express.Multer.File[]): Promise<Ticket> {
    const photoUrls = await Promise.all((files || []).map((f) => this.photos.upload(f)));
    return this.prisma.ticket.create({ data: { ...data, photos: photoUrls } });
  }

  findAll(filter: { status?: TicketStatus; buildingId?: number }) {
    const where: Prisma.TicketWhereInput = {};
    if (filter.status) where.status = filter.status;
    if (filter.buildingId) {
      where.unit = { buildingId: filter.buildingId };
    }
    return this.prisma.ticket.findMany({ where });
  }

  assign(id: number, assigneeId: number) {
    return this.prisma.ticket.update({
      where: { id },
      data: { assignedToId: assigneeId, status: TicketStatus.ASSIGNED },
    });
  }

  async updateStatus(id: number, status: TicketStatus) {
    const ticket = await this.prisma.ticket.update({ where: { id }, data: { status } });
    await this.notifications.ticketStatusChanged(ticket);
    return ticket;
  }
}
