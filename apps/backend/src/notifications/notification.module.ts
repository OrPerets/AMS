import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { PrismaService } from '../prisma.service';
import { NotificationController } from './notification.controller';

@Module({
  providers: [PrismaService, NotificationService],
  controllers: [NotificationController],
  exports: [NotificationService],
})
export class NotificationModule {}
