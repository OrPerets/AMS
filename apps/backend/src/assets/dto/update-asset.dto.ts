import type { MaintenanceCategory } from '@prisma/client';
import { IsBoolean, IsDateString, IsIn, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { MAINTENANCE_CATEGORIES } from '../../common/validation/prisma-enums';

export class UpdateAssetDto {
  @IsOptional()
  @IsInt()
  buildingId?: number;

  @IsOptional()
  @IsInt()
  unitId?: number;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsIn(MAINTENANCE_CATEGORIES)
  category?: MaintenanceCategory;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  serialNumber?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsDateString()
  purchaseDate?: string;

  @IsOptional()
  @IsDateString()
  warrantyExpiry?: string;

  @IsOptional()
  @IsNumber()
  value?: number;

  @IsOptional()
  @IsNumber()
  salvageValue?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  quantity?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  usefulLifeYears?: number;

  @IsOptional()
  @IsString()
  depreciationMethod?: string;

  @IsOptional()
  @IsDateString()
  lastInventoryCheck?: string;

  @IsOptional()
  @IsDateString()
  nextInventoryCheck?: string;

  @IsOptional()
  @IsBoolean()
  replacementRecommended?: boolean;

  @IsOptional()
  @IsString()
  replacementNotes?: string;

  @IsOptional()
  @IsString()
  inventoryStatus?: string;

  @IsOptional()
  @IsString()
  status?: string;
}
