import { IsArray, IsInt, IsOptional, IsString } from 'class-validator';

export class UpdateUnitDto {
  @IsOptional()
  @IsString()
  number?: string;

  @IsOptional()
  @IsInt()
  buildingId?: number;

  @IsOptional()
  @IsArray()
  residentIds?: number[];
}
