import { Controller, Get, Post, Body, Param, UseGuards, Req, Delete, Patch } from '@nestjs/common';
import { VoteService } from './vote.service';
import { CreateVoteDto, CastVoteDto, UpdateVoteDto } from './dto/vote.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles, Role } from '../auth/roles.decorator';

@Controller('api/v1/votes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VoteController {
  constructor(private readonly voteService: VoteService) {}

  @Post()
  @Roles(Role.RESIDENT, Role.PM, Role.ADMIN)
  async createVote(@Body() dto: CreateVoteDto, @Req() req: any) {
    return this.voteService.createVote(dto, req.user.userId);
  }

  @Get('building/:buildingId')
  @Roles(Role.RESIDENT, Role.PM, Role.ADMIN, Role.TECH)
  async getBuildingVotes(@Param('buildingId') buildingId: string, @Req() req: any) {
    return this.voteService.getVotesByBuilding(+buildingId, req.user.userId);
  }

  @Get(':id')
  @Roles(Role.RESIDENT, Role.PM, Role.ADMIN, Role.TECH)
  async getVoteDetails(@Param('id') voteId: string, @Req() req: any) {
    return this.voteService.getVoteDetails(+voteId, req.user.userId);
  }

  @Post(':id/cast')
  @Roles(Role.RESIDENT, Role.PM, Role.ADMIN)
  async castVote(
    @Param('id') voteId: string,
    @Body() dto: CastVoteDto,
    @Req() req: any
  ) {
    return this.voteService.castVote(+voteId, req.user.userId, dto);
  }

  @Get(':id/results')
  @Roles(Role.RESIDENT, Role.PM, Role.ADMIN, Role.TECH)
  async getResults(@Param('id') voteId: string) {
    return this.voteService.getVoteResults(+voteId);
  }

  @Post(':id/close')
  @Roles(Role.PM, Role.ADMIN)
  async closeVote(@Param('id') voteId: string, @Req() req: any) {
    return this.voteService.closeVote(+voteId, req.user.userId);
  }

  @Delete(':id')
  @Roles(Role.PM, Role.ADMIN)
  async deleteVote(@Param('id') voteId: string, @Req() req: any) {
    return this.voteService.deleteVote(+voteId, req.user.userId);
  }
}

