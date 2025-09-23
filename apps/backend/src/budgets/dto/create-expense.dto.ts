import { ExpenseCategory } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateExpenseDto {
  @IsInt()
  buildingId!: number;

  @IsOptional()
  @IsInt()
  budgetId?: number;

  @IsEnum(ExpenseCategory)
  category!: ExpenseCategory;

  @IsNumber()
  amount!: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  incurredAt?: string;
}
