import { IsDateString, IsInt, IsOptional } from 'class-validator';

export class ApproveWorkOrderDto {
  @IsInt()
  approvedById!: number;

  @IsOptional()
  @IsDateString()
  approvedAt?: string;
}
