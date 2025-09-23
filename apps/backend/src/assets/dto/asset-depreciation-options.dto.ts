import { IsInt, IsNumber, IsOptional, Min } from 'class-validator';

export class AssetDepreciationOptionsDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  usefulLifeYears?: number;

  @IsOptional()
  @IsNumber()
  salvageValue?: number;
}
