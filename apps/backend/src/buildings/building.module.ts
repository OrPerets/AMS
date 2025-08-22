import { Module } from '@nestjs/common';
import { BuildingService } from './building.service';
import { BuildingController } from './building.controller';
import { PrismaService } from '../prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';

@Module({
  providers: [PrismaService, BuildingService, JwtAuthGuard, RolesGuard],
  controllers: [BuildingController],
})
export class BuildingModule {}
