import { IsBoolean, IsDateString, IsInt, IsOptional, IsString } from 'class-validator';

export class VerifyMaintenanceDto {
  @IsInt()
  historyId!: number;

  @IsOptional()
  @IsBoolean()
  verified?: boolean;

  @IsOptional()
  @IsDateString()
  verifiedAt?: string;

  @IsOptional()
  @IsInt()
  verifiedById?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
