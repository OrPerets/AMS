import { IsInt, IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateDocumentDto {
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

  @IsString()
  name!: string;

  @IsUrl()
  url!: string;

  @IsOptional()
  @IsString()
  category?: string;
}
