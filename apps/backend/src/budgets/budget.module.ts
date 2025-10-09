import { Module } from '@nestjs/common';
import { BudgetService } from './budget.service';
import { BudgetController } from './budget.controller';
import { PrismaService } from '../prisma.service';
import { NotificationModule } from '../notifications/notification.module';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';

@Module({
  imports: [NotificationModule],
  providers: [PrismaService, BudgetService, JwtAuthGuard, RolesGuard],
  controllers: [BudgetController],
  exports: [BudgetService],
})
export class BudgetModule {}
