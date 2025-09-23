import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateWorkOrderCostDto {
  @IsOptional()
  @IsNumber()
  laborCost?: number;

  @IsOptional()
  @IsNumber()
  materialCost?: number;

  @IsOptional()
  @IsNumber()
  equipmentCost?: number;

  @IsOptional()
  @IsNumber()
  tax?: number;

  @IsOptional()
  @IsNumber()
  costEstimate?: number;

  @IsOptional()
  @IsString()
  costNotes?: string;
}
