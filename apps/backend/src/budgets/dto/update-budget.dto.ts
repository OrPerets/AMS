import type { BudgetStatus } from '@prisma/client';
import { IsIn, IsInt, IsNumber, IsOptional, IsString } from 'class-validator';
import { BUDGET_STATUSES } from '../../common/validation/prisma-enums';

export class UpdateBudgetDto {
  @IsOptional()
  @IsInt()
  buildingId?: number;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsInt()
  year?: number;

  @IsOptional()
  @IsNumber()
  amount?: number;

  @IsOptional()
  @IsIn(BUDGET_STATUSES)
  status?: BudgetStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}
