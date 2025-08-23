import { Module } from '@nestjs/common';
import { TicketService } from './ticket.service';
import { TicketController } from './ticket.controller';
import { PrismaService } from '../prisma.service';
import { PhotoService } from './photo.service';
import { NotificationService } from '../notifications/notification.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';

@Module({
  providers: [PrismaService, PhotoService, NotificationService, TicketService, JwtAuthGuard, RolesGuard],
  controllers: [TicketController],
})
export class TicketModule {}
