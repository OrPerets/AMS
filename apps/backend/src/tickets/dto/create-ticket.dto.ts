import { TicketSeverity } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsDateString, IsString } from 'class-validator';

export class CreateTicketDto {
  @Type(() => Number)
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
