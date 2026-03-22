import { Module } from '@nestjs/common';
import { ActivityModule } from '../activity/activity.module';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { PrismaService } from '../prisma.service';
import { GardensController } from './gardens.controller';
import { GardensService } from './gardens.service';

@Module({
  imports: [ActivityModule],
  controllers: [GardensController],
  providers: [GardensService, PrismaService, JwtAuthGuard, RolesGuard],
  exports: [GardensService],
})
export class GardensModule {}
