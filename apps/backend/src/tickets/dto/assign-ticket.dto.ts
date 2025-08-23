import { IsInt, IsOptional, IsNumber } from 'class-validator';

export class AssignTicketDto {
  @IsOptional()
  @IsInt()
  assigneeId?: number;

  @IsOptional()
  @IsInt()
  supplierId?: number;

  @IsOptional()
  @IsNumber()
  costEstimate?: number;
}
