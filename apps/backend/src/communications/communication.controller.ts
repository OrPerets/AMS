import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { CommunicationService } from './communication.service';
import { CreateCommunicationDto } from './dto/create-communication.dto';
import { UpdateCommunicationDto } from './dto/update-communication.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/roles.decorator';

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

  @Post('announcement')
  @Roles(Role.ADMIN, Role.PM)
  createAnnouncement(@Body() dto: {
    senderId?: number;
    buildingId?: number;
    unitIds?: number[];
    floor?: number;
    residentIds?: number[];
    recipientRole?: 'RESIDENT' | 'PM' | 'ADMIN';
    subject: string;
    message: string;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  }, @Req() req: any) {
    return this.communications.createAnnouncement({ ...dto, senderId: dto.senderId ?? req.user?.sub });
  }

  @Post('announcement/preview')
  @Roles(Role.ADMIN, Role.PM)
  previewAnnouncement(@Body() dto: {
    buildingId?: number;
    unitIds?: number[];
    floor?: number;
    residentIds?: number[];
    recipientRole?: 'RESIDENT' | 'PM' | 'ADMIN';
  }) {
    return this.communications.previewAnnouncement(dto);
  }

  @Get('announcements/history')
  @Roles(Role.ADMIN, Role.PM)
  announcementHistory(@Query('buildingId') buildingId?: string) {
    return this.communications.listAnnouncementHistory({ buildingId: buildingId ? +buildingId : undefined });
  }

  @Post('resident-request')
  @Roles(Role.RESIDENT)
  createResidentRequest(@Body() dto: {
    buildingId?: number;
    unitId?: number;
    requestType: 'MOVING' | 'PARKING' | 'DOCUMENT' | 'CONTACT_UPDATE' | 'GENERAL';
    subject: string;
    message: string;
    requestedDate?: string;
    metadata?: Record<string, any>;
  }, @Req() req: any) {
    return this.communications.createResidentRequest(req.user?.sub, dto);
  }

  @Get('resident-requests')
  @Roles(Role.ADMIN, Role.PM, Role.RESIDENT)
  residentRequests(@Req() req: any, @Query('status') status?: string, @Query('requestType') requestType?: string) {
    return this.communications.listResidentRequests({
      userId: req.user?.sub,
      role: req.user?.actAsRole ?? req.user?.role,
      status,
      requestType,
    });
  }

  @Put('resident-requests/:requestKey/status')
  @Roles(Role.ADMIN, Role.PM)
  updateResidentRequestStatus(
    @Param('requestKey') requestKey: string,
    @Req() req: any,
    @Body() body: { status: 'SUBMITTED' | 'IN_REVIEW' | 'COMPLETED' | 'CLOSED'; statusNotes?: string | null },
  ) {
    return this.communications.updateResidentRequestStatus(requestKey, req.user?.sub, body);
  }

  @Get('published-documents')
  @Roles(Role.ADMIN, Role.PM, Role.RESIDENT, Role.ACCOUNTANT)
  publishedDocuments(@Query('buildingId') buildingId?: string) {
    return this.communications.listPublishedDocuments(buildingId ? +buildingId : undefined);
  }

  @Post('document-bulletin')
  @Roles(Role.ADMIN, Role.PM)
  publishDocumentBulletin(
    @Req() req: any,
    @Body() body: {
      documentId: number;
      buildingId: number;
      bulletinType: 'meeting_summary' | 'signed_protocol' | 'regulation' | 'committee_decision';
      subject: string;
      message: string;
    },
  ) {
    return this.communications.publishDocumentNotice({
      ...body,
      senderId: req.user?.sub,
    });
  }

  @Get('conversation/:user1Id/:user2Id')
  @Roles(Role.ADMIN, Role.PM, Role.TECH, Role.RESIDENT)
  getConversation(
    @Param('user1Id') user1Id: string,
    @Param('user2Id') user2Id: string,
    @Query('buildingId') buildingId?: string
  ) {
    return this.communications.getConversation(+user1Id, +user2Id, buildingId ? +buildingId : undefined);
  }

  @Get('search')
  @Roles(Role.ADMIN, Role.PM, Role.TECH, Role.RESIDENT)
  searchCommunications(
    @Query('query') query?: string,
    @Query('userId') userId?: string,
    @Query('buildingId') buildingId?: string,
  ) {
    return this.communications.searchCommunications(query ?? '', userId ? +userId : undefined, buildingId ? +buildingId : undefined);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.communications.findOne(+id);
  }
}
