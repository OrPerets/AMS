import type { CodeType } from '@prisma/client';
import { IsString, IsIn, IsOptional, IsBoolean, IsInt, IsDateString } from 'class-validator';
import { CODE_TYPES } from '../../common/validation/prisma-enums';

export class CreateBuildingCodeDto {
  @IsInt()
  buildingId!: number;

  @IsIn(CODE_TYPES)
  codeType!: CodeType;

  @IsString()
  code!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  validFrom?: Date;

  @IsOptional()
  @IsDateString()
  validUntil?: Date;
}

export class UpdateBuildingCodeDto {
  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsDateString()
  validUntil?: Date;
}
