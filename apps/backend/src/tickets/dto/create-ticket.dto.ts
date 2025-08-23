import { TicketSeverity } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsDateString } from 'class-validator';

export class CreateTicketDto {
  @IsInt()
  unitId: number;

  @IsEnum(TicketSeverity)
  severity: TicketSeverity;

  @IsOptional()
  @IsDateString()
  slaDue?: string;
}
