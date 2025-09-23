import { BudgetStatus } from '@prisma/client';
import { IsEnum, IsInt, IsNumber, IsOptional, IsString } from 'class-validator';

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
  @IsEnum(BudgetStatus)
  status?: BudgetStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}
