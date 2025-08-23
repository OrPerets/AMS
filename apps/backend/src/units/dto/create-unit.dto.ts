import { IsArray, IsInt, IsOptional, IsString } from 'class-validator';

export class CreateUnitDto {
  @IsString()
  number!: string;

  @IsInt()
  buildingId!: number;

  @IsOptional()
  @IsArray()
  residentIds?: number[];
}
