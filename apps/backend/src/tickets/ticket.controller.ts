import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  Param,
  Patch,
} from '@nestjs/common';
import { TicketService } from './ticket.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { AssignTicketDto } from './dto/assign-ticket.dto';
import { UpdateTicketStatusDto } from './dto/update-ticket-status.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role, TicketStatus } from '@prisma/client';
import { FilesInterceptor } from '@nestjs/platform-express';

@Controller('api/v1/tickets')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TicketController {
  constructor(private tickets: TicketService) {}

  @Post()
  @Roles(Role.RESIDENT)
  @UseInterceptors(FilesInterceptor('photos'))
  create(@Body() dto: CreateTicketDto, @UploadedFiles() photos: Express.Multer.File[]) {
    return this.tickets.create({
      unit: { connect: { id: dto.unitId } },
      severity: dto.severity,
      slaDue: dto.slaDue ? new Date(dto.slaDue) : undefined,
    }, photos);
  }

  @Get()
  findAll(@Query('status') status?: TicketStatus, @Query('buildingId') buildingId?: string) {
    return this.tickets.findAll({
      status,
      buildingId: buildingId ? +buildingId : undefined,
    });
  }

  @Patch(':id/assign')
  @Roles(Role.ADMIN, Role.PM)
  assign(@Param('id') id: string, @Body() dto: AssignTicketDto) {
    return this.tickets.assign(+id, dto);
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN, Role.PM, Role.TECH)
  updateStatus(@Param('id') id: string, @Body() dto: UpdateTicketStatusDto) {
    return this.tickets.updateStatus(+id, dto.status);
  }
}
