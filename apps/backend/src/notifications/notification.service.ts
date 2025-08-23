import { Injectable } from '@nestjs/common';
import { Ticket } from '@prisma/client';

@Injectable()
export class NotificationService {
  async ticketStatusChanged(ticket: Ticket): Promise<void> {
    // Placeholder for email/push notification integration
    console.log(`Notify: Ticket ${ticket.id} status changed to ${ticket.status}`);
  }
}
