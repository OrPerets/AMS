import { IsString, IsEnum, IsOptional, IsBoolean, IsInt, IsDateString } from 'class-validator';
import { CodeType } from '@prisma/client';

export class CreateBuildingCodeDto {
  @IsInt()
  buildingId!: number;

  @IsEnum(CodeType)
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

