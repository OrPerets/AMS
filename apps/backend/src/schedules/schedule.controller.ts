import { Controller, Get, Post, Body, Param, UseGuards, Req, Delete, Patch, Query } from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { CreateScheduleDto, UpdateScheduleDto, CreateTaskDto, UpdateTaskDto, CompleteTaskDto } from './dto/schedule.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles, Role } from '../auth/roles.decorator';

@Controller('api/v1/schedules')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Post()
  @Roles(Role.ADMIN, Role.PM, Role.TECH)
  async createSchedule(@Body() dto: CreateScheduleDto, @Req() req: any) {
    return this.scheduleService.createSchedule(dto, req.user.userId);
  }

  @Get('date/:date')
  @Roles(Role.ADMIN, Role.PM, Role.TECH)
  async getSchedulesByDate(
    @Param('date') date: string,
    @Query('buildingId') buildingId?: string
  ) {
    return this.scheduleService.getSchedulesByDate(
      new Date(date),
      buildingId ? +buildingId : undefined
    );
  }

  @Get('range')
  @Roles(Role.ADMIN, Role.PM, Role.TECH)
  async getSchedulesByRange(
    @Query('start') start: string,
    @Query('end') end: string,
    @Query('buildingId') buildingId?: string
  ) {
    return this.scheduleService.getSchedulesByDateRange(
      new Date(start),
      new Date(end),
      buildingId ? +buildingId : undefined,
    );
  }

  @Get('my')
  @Roles(Role.TECH)
  async getMySchedules(@Req() req: any, @Query('date') date?: string) {
    return this.scheduleService.getMySchedules(
      req.user.userId,
      date ? new Date(date) : undefined
    );
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.PM, Role.TECH)
  async getSchedule(@Param('id') id: string) {
    return this.scheduleService.getSchedule(+id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.PM)
  async updateSchedule(@Param('id') id: string, @Body() dto: UpdateScheduleDto) {
    return this.scheduleService.updateSchedule(+id, dto);
  }

  @Post(':id/publish')
  @Roles(Role.ADMIN, Role.PM)
  async publishSchedule(@Param('id') id: string) {
    return this.scheduleService.publishSchedule(+id);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.PM)
  async deleteSchedule(@Param('id') id: string, @Req() req: any) {
    return this.scheduleService.deleteSchedule(+id, req.user.userId);
  }

  @Post(':id/tasks')
  @Roles(Role.ADMIN, Role.PM)
  async addTask(@Param('id') id: string, @Body() dto: CreateTaskDto) {
    return this.scheduleService.addTask(+id, dto);
  }

  @Patch('tasks/:taskId')
  @Roles(Role.ADMIN, Role.PM, Role.TECH)
  async updateTask(@Param('taskId') taskId: string, @Body() dto: UpdateTaskDto) {
    return this.scheduleService.updateTask(+taskId, dto);
  }

  @Delete('tasks/:taskId')
  @Roles(Role.ADMIN, Role.PM)
  async deleteTask(@Param('taskId') taskId: string) {
    return this.scheduleService.deleteTask(+taskId);
  }

  @Post('tasks/:taskId/start')
  @Roles(Role.TECH)
  async startTask(@Param('taskId') taskId: string, @Req() req: any) {
    return this.scheduleService.startTask(+taskId, req.user.userId);
  }

  @Post('tasks/:taskId/complete')
  @Roles(Role.TECH)
  async completeTask(
    @Param('taskId') taskId: string,
    @Body() body: CompleteTaskDto,
    @Req() req: any
  ) {
    return this.scheduleService.completeTask(+taskId, req.user.userId, body.notes);
  }

  @Get(':id/progress')
  @Roles(Role.ADMIN, Role.PM, Role.TECH)
  async getScheduleProgress(@Param('id') id: string) {
    return this.scheduleService.getScheduleProgress(+id);
  }
}
