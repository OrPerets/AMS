import { Module } from '@nestjs/common';
import { BudgetService } from './budget.service';
import { BudgetController } from './budget.controller';
import { PrismaService } from '../prisma.service';
import { NotificationService } from '../notifications/notification.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';

@Module({
  providers: [PrismaService, BudgetService, JwtAuthGuard, RolesGuard, NotificationService],
  controllers: [BudgetController],
  exports: [BudgetService],
})
export class BudgetModule {}
