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
  Delete,
  Request,
} from '@nestjs/common';
import { TicketService } from './ticket.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { AssignTicketDto } from './dto/assign-ticket.dto';
import { UpdateTicketStatusDto } from './dto/update-ticket-status.dto';
import { CreateTicketCommentDto } from './dto/create-ticket-comment.dto';
import { UpdateTicketCommentDto } from './dto/update-ticket-comment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles, Role } from '../auth/roles.decorator';
import { TicketStatus } from '@prisma/client';
import { FilesInterceptor } from '@nestjs/platform-express';
import { imageUploadOptions } from '../uploads/upload.utils';

@Controller('api/v1/tickets')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TicketController {
  constructor(private tickets: TicketService) {}

  @Post()
  @Roles(Role.RESIDENT)
  @UseInterceptors(FilesInterceptor('photos', 10, imageUploadOptions))
  create(@Body() dto: CreateTicketDto, @UploadedFiles() photos: Express.Multer.File[], @Request() req: any) {
    return this.tickets.create({
      unit: { connect: { id: dto.unitId } },
      severity: dto.severity,
      slaDue: dto.slaDue ? new Date(dto.slaDue) : undefined,
    }, photos, dto.description, req.user.id);
  }

  @Get()
  findAll(@Query('status') status?: TicketStatus, @Query('buildingId') buildingId?: string) {
    return this.tickets.findAll({
      status,
      buildingId: buildingId ? +buildingId : undefined,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tickets.findOne(+id);
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

  @Post(':id/comments')
  @Roles(Role.ADMIN, Role.PM, Role.TECH, Role.RESIDENT)
  addComment(
    @Param('id') id: string,
    @Body() dto: CreateTicketCommentDto,
    @Request() req: any
  ) {
    return this.tickets.addComment(+id, req.user.id, dto.content);
  }

  @Patch('comments/:commentId')
  @Roles(Role.ADMIN, Role.PM, Role.TECH, Role.RESIDENT)
  updateComment(
    @Param('commentId') commentId: string,
    @Body() dto: UpdateTicketCommentDto,
    @Request() req: any
  ) {
    return this.tickets.updateComment(+commentId, req.user.id, dto.content);
  }

  @Delete('comments/:commentId')
  @Roles(Role.ADMIN, Role.PM, Role.TECH, Role.RESIDENT)
  deleteComment(
    @Param('commentId') commentId: string,
    @Request() req: any
  ) {
    return this.tickets.deleteComment(+commentId, req.user.id);
  }
}
