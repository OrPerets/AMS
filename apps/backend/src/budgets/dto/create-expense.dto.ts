import type { ExpenseCategory } from '@prisma/client';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { EXPENSE_CATEGORIES } from '../../common/validation/prisma-enums';

export class CreateExpenseDto {
  @IsInt()
  buildingId!: number;

  @IsOptional()
  @IsInt()
  budgetId?: number;

  @IsIn(EXPENSE_CATEGORIES)
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
