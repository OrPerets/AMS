import { IsOptional, IsString } from 'class-validator';

export class UpdateAssetLocationDto {
  @IsString()
  location!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
