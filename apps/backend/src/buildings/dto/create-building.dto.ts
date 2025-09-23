import {
  IsArray,
  IsEmail,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateBuildingDto {
  @IsString()
  name!: string;

  @IsString()
  address!: string;

  @IsInt()
  tenantId!: number;

  @IsOptional()
  @IsInt()
  yearBuilt?: number;

  @IsOptional()
  @IsInt()
  floors?: number;

  @IsOptional()
  @IsInt()
  totalUnits?: number;

  @IsOptional()
  @IsNumber()
  area?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenities?: string[];

  @IsOptional()
  @IsString()
  managerName?: string;

  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
