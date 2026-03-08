import type { MaintenanceCategory, MaintenancePriority, MaintenanceType } from '@prisma/client';
import { IsArray, IsDateString, IsIn, IsInt, IsNumber, IsOptional, IsString } from 'class-validator';
import { MAINTENANCE_CATEGORIES, MAINTENANCE_PRIORITIES, MAINTENANCE_TYPES } from '../../common/validation/prisma-enums';

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

  @IsIn(MAINTENANCE_CATEGORIES)
  category!: MaintenanceCategory;

  @IsIn(MAINTENANCE_TYPES)
  type!: MaintenanceType;

  @IsString()
  frequency!: string;

  @IsOptional()
  @IsString()
  recurrenceRule?: string;

  @IsDateString()
  startDate!: string;

  @IsOptional()
  @IsDateString()
  nextOccurrence?: string;

  @IsOptional()
  @IsInt()
  assignedToId?: number;

  @IsOptional()
  @IsIn(MAINTENANCE_PRIORITIES)
  priority?: MaintenancePriority;

  @IsOptional()
  @IsNumber()
  estimatedCost?: number;

  @IsOptional()
  @IsString()
  completionNotes?: string;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  teamMemberIds?: number[];
}
