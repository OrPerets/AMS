import type { TicketSeverity } from '@prisma/client';
import { IsIn } from 'class-validator';
import { TICKET_SEVERITIES } from '../../common/validation/prisma-enums';

export class UpdateTicketSeverityDto {
  @IsIn(TICKET_SEVERITIES)
  severity!: TicketSeverity;
}
