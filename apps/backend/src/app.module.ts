import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './users/user.module';
import { BuildingModule } from './buildings/building.module';
import { UnitModule } from './units/unit.module';
import { TicketModule } from './tickets/ticket.module';
import { WorkOrderModule } from './work-orders/work-order.module';
import { PaymentModule } from './payments/payment.module';
import { NotificationModule } from './notifications/notification.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { AdminModule } from './admin/admin.module';
import { MaintenanceModule } from './maintenance/maintenance.module';
import { BudgetModule } from './budgets/budget.module';
import { DocumentModule } from './documents/document.module';
import { AssetModule } from './assets/asset.module';
import { CommunicationModule } from './communications/communication.module';
import { FinancialModule } from './reports/financial/financial.module';
import { WebSocketModule } from './websocket/websocket.module';
import { VoteModule } from './votes/vote.module';
import { ScheduleModule } from './schedules/schedule.module';

@Module({
  imports: [
    AuthModule,
    UserModule,
    BuildingModule,
    UnitModule,
    TicketModule,
    WorkOrderModule,
    PaymentModule,
    NotificationModule,
    MaintenanceModule,
    BudgetModule,
    DocumentModule,
    AssetModule,
    CommunicationModule,
    DashboardModule,
    AdminModule,
    FinancialModule,
    WebSocketModule,
    VoteModule,
    ScheduleModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
