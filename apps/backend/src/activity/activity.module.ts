import { Module } from '@nestjs/common';
import { ActivityService } from './activity.service';
import { PrismaService } from '../prisma.service';

@Module({
  providers: [ActivityService, PrismaService],
  exports: [ActivityService],
})
export class ActivityModule {}
