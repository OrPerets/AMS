import type { WorkOrderStatus } from '@prisma/client';
import { IsDateString, IsIn, IsOptional, IsString } from 'class-validator';
import { WORK_ORDER_STATUSES } from '../../common/validation/prisma-enums';

export class UpdateWorkOrderStatusDto {
  @IsIn(WORK_ORDER_STATUSES)
  status!: WorkOrderStatus;

  @IsOptional()
  @IsDateString()
  scheduledStart?: string;

  @IsOptional()
  @IsDateString()
  scheduledEnd?: string;

  @IsOptional()
  @IsDateString()
  completedAt?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
