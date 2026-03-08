import type { BudgetStatus } from '@prisma/client';
import { IsIn, IsInt, IsNumber, IsOptional, IsString } from 'class-validator';
import { BUDGET_STATUSES } from '../../common/validation/prisma-enums';

export class CreateBudgetDto {
  @IsInt()
  buildingId!: number;

  @IsString()
  name!: string;

  @IsInt()
  year!: number;

  @IsNumber()
  amount!: number;

  @IsOptional()
  @IsIn(BUDGET_STATUSES)
  status?: BudgetStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}
