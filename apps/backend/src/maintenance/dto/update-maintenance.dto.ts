import type { MaintenanceCategory, MaintenancePriority, MaintenanceType } from '@prisma/client';
import { IsArray, IsBoolean, IsDateString, IsIn, IsInt, IsNumber, IsOptional, IsString } from 'class-validator';
import { MAINTENANCE_CATEGORIES, MAINTENANCE_PRIORITIES, MAINTENANCE_TYPES } from '../../common/validation/prisma-enums';

export class UpdateMaintenanceDto {
  @IsOptional()
  @IsInt()
  buildingId?: number;

  @IsOptional()
  @IsInt()
  assetId?: number;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(MAINTENANCE_CATEGORIES)
  category?: MaintenanceCategory;

  @IsOptional()
  @IsIn(MAINTENANCE_TYPES)
  type?: MaintenanceType;

  @IsOptional()
  @IsString()
  frequency?: string;

  @IsOptional()
  @IsString()
  recurrenceRule?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

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
  @IsBoolean()
  completionVerified?: boolean;

  @IsOptional()
  @IsDateString()
  verifiedAt?: string;

  @IsOptional()
  @IsInt()
  verifiedById?: number;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  teamMemberIds?: number[];
}
