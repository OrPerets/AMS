import { Module } from '@nestjs/common';
import { NotificationModule } from '../notifications/notification.module';
import { PrismaService } from '../prisma.service';
import { SupportController } from './support.controller';
import { SupportService } from './support.service';

@Module({
  imports: [NotificationModule],
  controllers: [SupportController],
  providers: [SupportService, PrismaService],
})
export class SupportModule {}
