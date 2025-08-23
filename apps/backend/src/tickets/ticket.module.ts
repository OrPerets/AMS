import { Module } from '@nestjs/common';
import { TicketService } from './ticket.service';
import { TicketController } from './ticket.controller';
import { PrismaService } from '../prisma.service';
import { PhotoService } from './photo.service';
import { NotificationModule } from '../notifications/notification.module';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';

@Module({
  imports: [NotificationModule],
  providers: [PrismaService, PhotoService, TicketService, JwtAuthGuard, RolesGuard],
  controllers: [TicketController],
})
export class TicketModule {}
