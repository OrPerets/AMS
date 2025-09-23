import { Module } from '@nestjs/common';
import { CommunicationService } from './communication.service';
import { CommunicationController } from './communication.controller';
import { PrismaService } from '../prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';

@Module({
  providers: [PrismaService, CommunicationService, JwtAuthGuard, RolesGuard],
  controllers: [CommunicationController],
  exports: [CommunicationService],
})
export class CommunicationModule {}
