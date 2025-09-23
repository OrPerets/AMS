import { IsDateString, IsInt, IsNumber, IsOptional, IsString } from 'class-validator';

export class CompleteMaintenanceDto {
  @IsDateString()
  performedAt!: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsNumber()
  cost?: number;

  @IsOptional()
  @IsInt()
  performedById?: number;
}
