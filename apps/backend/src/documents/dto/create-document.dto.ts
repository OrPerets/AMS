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

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  tags?: string[];

  @IsOptional()
  fileSize?: number;

  @IsOptional()
  @IsString()
  mimeType?: string;

  @IsOptional()
  @IsString()
  accessLevel?: 'PUBLIC' | 'PRIVATE' | 'RESTRICTED';
}
