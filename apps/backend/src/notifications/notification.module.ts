import { Module, forwardRef } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { PrismaService } from '../prisma.service';
import { NotificationController } from './notification.controller';
import { WebSocketModule } from '../websocket/websocket.module';

@Module({
  imports: [forwardRef(() => WebSocketModule)],
  providers: [PrismaService, NotificationService],
  controllers: [NotificationController],
  exports: [NotificationService],
})
export class NotificationModule {}
