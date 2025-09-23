import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';
import { MaintenanceCategory, MaintenanceType } from '@prisma/client';

export class CreateMaintenanceDto {
  @IsInt()
  buildingId!: number;

  @IsOptional()
  @IsInt()
  assetId?: number;

  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(MaintenanceCategory)
  category!: MaintenanceCategory;

  @IsEnum(MaintenanceType)
  type!: MaintenanceType;

  @IsString()
  frequency!: string;

  @IsDateString()
  startDate!: string;

  @IsOptional()
  @IsDateString()
  nextOccurrence?: string;

  @IsOptional()
  @IsInt()
  assignedToId?: number;
}
