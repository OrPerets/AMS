import type { TicketStatus } from '@prisma/client';
import { IsIn } from 'class-validator';
import { TICKET_STATUSES } from '../../common/validation/prisma-enums';

export class UpdateTicketStatusDto {
  @IsIn(TICKET_STATUSES)
  status!: TicketStatus;
}
