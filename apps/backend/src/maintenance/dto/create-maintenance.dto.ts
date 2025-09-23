import { IsArray, IsDateString, IsEnum, IsInt, IsNumber, IsOptional, IsString } from 'class-validator';
import { MaintenanceCategory, MaintenancePriority, MaintenanceType } from '@prisma/client';

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
  @IsEnum(MaintenancePriority)
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
