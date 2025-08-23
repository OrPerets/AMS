import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './users/user.module';
import { BuildingModule } from './buildings/building.module';
import { UnitModule } from './units/unit.module';
import { TicketModule } from './tickets/ticket.module';
import { WorkOrderModule } from './work-orders/work-order.module';
import { PaymentModule } from './payments/payment.module';
import { NotificationModule } from './notifications/notification.module';
import { DashboardModule } from './dashboard/dashboard.module';

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
    DashboardModule,
  ],
})
export class AppModule {}
