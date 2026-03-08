import type { WorkOrderStatus } from '@prisma/client';
import { IsDateString, IsIn, IsInt, IsOptional } from 'class-validator';
import { WORK_ORDER_STATUSES } from '../../common/validation/prisma-enums';

export class WorkOrderReportQueryDto {
  @IsOptional()
  @IsDateString()
  start?: string;

  @IsOptional()
  @IsDateString()
  end?: string;

  @IsOptional()
  @IsInt()
  supplierId?: number;

  @IsOptional()
  @IsIn(WORK_ORDER_STATUSES)
  status?: WorkOrderStatus;
}
