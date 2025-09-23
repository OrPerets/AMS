import { IsInt, IsOptional, IsString, IsUrl } from 'class-validator';

export class UpdateDocumentDto {
  @IsOptional()
  @IsInt()
  buildingId?: number;

  @IsOptional()
  @IsInt()
  unitId?: number;

  @IsOptional()
  @IsInt()
  contractId?: number;

  @IsOptional()
  @IsInt()
  assetId?: number;

  @IsOptional()
  @IsInt()
  expenseId?: number;

  @IsOptional()
  @IsInt()
  uploadedById?: number;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsUrl()
  url?: string;

  @IsOptional()
  @IsString()
  category?: string;
}
