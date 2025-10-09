import { TicketSeverity } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsDateString, IsString } from 'class-validator';

export class CreateTicketDto {
  @IsInt()
  unitId!: number;

  @IsEnum(TicketSeverity)
  severity!: TicketSeverity;

  @IsOptional()
  @IsDateString()
  slaDue?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
