import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { CommunicationService } from './communication.service';
import { CreateCommunicationDto } from './dto/create-communication.dto';
import { UpdateCommunicationDto } from './dto/update-communication.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('api/v1/communications')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.PM, Role.TECH, Role.RESIDENT)
export class CommunicationController {
  constructor(private communications: CommunicationService) {}

  @Post()
  create(@Body() dto: CreateCommunicationDto) {
    return this.communications.create(dto);
  }

  @Get()
  findAll() {
    return this.communications.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.communications.findOne(+id);
  }

  @Get('building/:buildingId')
  findForBuilding(@Param('buildingId') buildingId: string) {
    return this.communications.findForBuilding(+buildingId);
  }

  @Get('inbox/:userId')
  inbox(@Param('userId') userId: string) {
    return this.communications.getInbox(+userId);
  }

  @Get('outbox/:userId')
  outbox(@Param('userId') userId: string) {
    return this.communications.getOutbox(+userId);
  }

  @Post(':id/read')
  markRead(@Param('id') id: string) {
    return this.communications.markRead(+id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCommunicationDto) {
    return this.communications.update(+id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.communications.remove(+id);
  }
}
