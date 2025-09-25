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

  async assign(id: number, dto: { assigneeId?: number; supplierId?: number; costEstimate?: number }) {
    if (dto.assigneeId) {
      return this.prisma.ticket.update({
        where: { id },
        data: { assignedToId: dto.assigneeId, status: TicketStatus.ASSIGNED },
      });
    }
    if (dto.supplierId) {
      await this.prisma.workOrder.create({
        data: {
          ticket: { connect: { id } },
          supplier: { connect: { id: dto.supplierId } },
          costEstimate: dto.costEstimate,
        },
      });
      return this.prisma.ticket.update({
        where: { id },
        data: { status: TicketStatus.ASSIGNED },
      });
    }
    throw new Error('No assignee specified');
  }

  async updateStatus(id: number, status: TicketStatus) {
    const ticket = await this.prisma.ticket.update({ where: { id }, data: { status } });
    await this.notifications.ticketStatusChanged(ticket);
    return ticket;
  }

  findOne(id: number) {
    return this.prisma.ticket.findUnique({ 
      where: { id },
      include: {
        comments: {
          include: {
            author: {
              select: {
                id: true,
                email: true,
                role: true
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        },
        unit: {
          include: {
            building: true
          }
        },
        assignedTo: {
          select: {
            id: true,
            email: true,
            role: true
          }
        }
      }
    });
  }

  async addComment(ticketId: number, authorId: number, content: string) {
    return this.prisma.ticketComment.create({
      data: {
        ticketId,
        authorId,
        content
      },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            role: true
          }
        }
      }
    });
  }

  async updateComment(commentId: number, authorId: number, content: string) {
    // Verify the comment belongs to the author
    const comment = await this.prisma.ticketComment.findFirst({
      where: { id: commentId, authorId }
    });
    
    if (!comment) {
      throw new Error('Comment not found or unauthorized');
    }

    return this.prisma.ticketComment.update({
      where: { id: commentId },
      data: { content },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            role: true
          }
        }
      }
    });
  }

  async deleteComment(commentId: number, authorId: number) {
    // Verify the comment belongs to the author
    const comment = await this.prisma.ticketComment.findFirst({
      where: { id: commentId, authorId }
    });
    
    if (!comment) {
      throw new Error('Comment not found or unauthorized');
    }

    return this.prisma.ticketComment.delete({
      where: { id: commentId }
    });
  }
}
