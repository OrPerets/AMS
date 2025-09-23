import {
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateUnitDto {
  @IsString()
  number!: string;

  @IsInt()
  buildingId!: number;

  @IsOptional()
  @IsArray()
  residentIds?: number[];

  @IsOptional()
  @IsNumber()
  area?: number;

  @IsOptional()
  @IsInt()
  bedrooms?: number;

  @IsOptional()
  @IsInt()
  bathrooms?: number;

  @IsOptional()
  @IsInt()
  parkingSpaces?: number;

  @IsOptional()
  @IsInt()
  floor?: number;
}
