import type { TicketSeverity } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsDateString, IsString } from 'class-validator';
import { TICKET_SEVERITIES } from '../../common/validation/prisma-enums';

export class CreateTicketDto {
  @Type(() => Number)
  @IsInt()
  unitId!: number;

  @IsIn(TICKET_SEVERITIES)
  severity!: TicketSeverity;

  @IsOptional()
  @IsDateString()
  slaDue?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
