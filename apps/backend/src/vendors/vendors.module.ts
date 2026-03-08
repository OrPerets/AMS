import { Module } from '@nestjs/common';
import { ActivityModule } from '../activity/activity.module';
import { PrismaService } from '../prisma.service';
import { VendorsController } from './vendors.controller';
import { VendorsService } from './vendors.service';

@Module({
  imports: [ActivityModule],
  controllers: [VendorsController],
  providers: [VendorsService, PrismaService],
})
export class VendorsModule {}
