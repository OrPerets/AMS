import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { Public } from '../auth/roles.decorator';
import { SupportService } from './support.service';

@Controller('api/v1/support')
export class SupportController {
  constructor(private support: SupportService) {}

  @Post()
  @Public()
  submit(
    @Body()
    body: {
      name?: string;
      email?: string;
      subject?: string;
      message?: string;
      category?: string;
      urgency?: string;
    },
  ) {
    if (!body.name || !body.email || !body.subject || !body.message) {
      throw new BadRequestException('Missing required support fields');
    }

    return this.support.submit({
      name: body.name,
      email: body.email,
      subject: body.subject,
      message: body.message,
      category: body.category,
      urgency: body.urgency,
    });
  }
}
