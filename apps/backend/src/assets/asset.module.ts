import { Module } from '@nestjs/common';
import { AssetService } from './asset.service';
import { AssetController } from './asset.controller';
import { PrismaService } from '../prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';

@Module({
  providers: [PrismaService, AssetService, JwtAuthGuard, RolesGuard],
  controllers: [AssetController],
  exports: [AssetService],
})
export class AssetModule {}
