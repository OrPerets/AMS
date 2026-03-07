import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Prisma, TicketStatus, Ticket } from '@prisma/client';
import { PhotoService } from './photo.service';
import { NotificationService } from '../notifications/notification.service';
import { WebSocketGateway } from '../websocket/websocket.gateway';

@Injectable()
export class TicketService {
  constructor(
    private prisma: PrismaService,
    private photos: PhotoService,
    private notifications: NotificationService,
    private websocketGateway: WebSocketGateway,
  ) {}

  async create(data: Prisma.TicketCreateInput, files: Express.Multer.File[], description?: string, authorId?: number): Promise<Ticket> {
    const photoUrls = await Promise.all((files || []).map((f) => this.photos.upload(f)));
    const ticket = await this.prisma.ticket.create({ 
      data: { ...data, photos: photoUrls },
      include: {
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

    // Create initial comment with description if provided
    if (description && authorId) {
      await this.prisma.ticketComment.create({
        data: {
          ticketId: ticket.id,
          authorId: authorId,
          content: description
        }
      });
    }

    // Get users who should be notified (admins, PMs, assigned users)
    const usersToNotify = await this.prisma.user.findMany({
      where: {
        OR: [
          { role: 'ADMIN' },
          { role: 'PM' },
          { role: 'MASTER' },
          ...(ticket.assignedToId ? [{ id: ticket.assignedToId }] : [])
        ]
      },
      select: { id: true }
    });

    const userIds = usersToNotify.map(u => u.id);

    // Emit WebSocket event for new ticket
    this.websocketGateway.notifyNewTicket(ticket, userIds);
    
    // Create notifications for all relevant users
    await Promise.all(userIds.map(userId => 
      this.notifications.create({
        tenantId: 1,
        userId,
        title: 'קריאה חדשה נפתחה',
        message: `קריאה מספר ${ticket.id} נפתחה בבניין ${ticket.unit.building.name}`,
        type: 'TICKET_CREATED',
        metadata: { ticketId: ticket.id, buildingId: ticket.unit.building.id }
      })
    ));

    return ticket;
  }

  findAll(filter: { status?: TicketStatus; buildingId?: number }) {
    const where: Prisma.TicketWhereInput = {};
    if (filter.status) where.status = filter.status;
    if (filter.buildingId) {
      where.unit = { buildingId: filter.buildingId };
    }
    return this.prisma.ticket.findMany({
      where,
      include: {
        comments: {
          include: {
            author: {
              select: {
                id: true,
                email: true,
                role: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        unit: {
          include: {
            building: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
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
    const ticket = await this.prisma.ticket.update({ 
      where: { id }, 
      data: { status },
      include: {
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
    
    await this.notifications.ticketStatusChanged(ticket);
    
    // Emit WebSocket event for ticket update
    this.websocketGateway.notifyTicketUpdate(ticket);
    
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
