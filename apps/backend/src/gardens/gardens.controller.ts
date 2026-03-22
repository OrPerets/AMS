import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Role, Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import {
  CreateGardensMonthDto,
  ReviewGardensPlanDto,
  SaveGardensAssignmentsDto,
  SendGardensRemindersDto,
} from './dto/gardens.dto';
import { GardensService } from './gardens.service';

@Controller('api/v1/gardens')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GardensController {
  constructor(private readonly gardens: GardensService) {}

  @Get('dashboard')
  @Roles(Role.ADMIN, Role.PM, Role.MASTER)
  getManagerDashboard(@Req() req: any) {
    return this.gardens.getManagerDashboard(req.user);
  }

  @Get('months')
  @Roles(Role.ADMIN, Role.PM, Role.MASTER)
  listMonths(@Req() req: any) {
    return this.gardens.listMonths(req.user);
  }

  @Post('months')
  @Roles(Role.ADMIN, Role.PM, Role.MASTER)
  createMonth(@Req() req: any, @Body() dto: CreateGardensMonthDto) {
    return this.gardens.createMonth(req.user, dto);
  }

  @Get('months/:plan/dashboard')
  @Roles(Role.ADMIN, Role.PM, Role.MASTER)
  getMonthDashboard(@Req() req: any, @Param('plan') plan: string) {
    return this.gardens.getMonthDashboard(req.user, plan);
  }

  @Get('months/:plan/overview')
  @Roles(Role.ADMIN, Role.PM, Role.MASTER)
  getMonthOverview(@Req() req: any, @Param('plan') plan: string) {
    return this.gardens.getMonthDashboard(req.user, plan);
  }

  @Get('months/:plan/workers/:workerProfileId')
  @Roles(Role.ADMIN, Role.PM, Role.MASTER)
  getWorkerPlanDetail(
    @Req() req: any,
    @Param('plan') plan: string,
    @Param('workerProfileId') workerProfileId: string,
  ) {
    return this.gardens.getWorkerPlanDetail(req.user, plan, Number.parseInt(workerProfileId, 10));
  }

  @Patch('months/:plan/workers/:workerProfileId/review')
  @Roles(Role.ADMIN, Role.PM, Role.MASTER)
  reviewWorkerPlan(
    @Req() req: any,
    @Param('plan') plan: string,
    @Param('workerProfileId') workerProfileId: string,
    @Body() dto: ReviewGardensPlanDto,
  ) {
    return this.gardens.reviewWorkerPlan(
      req.user,
      plan,
      Number.parseInt(workerProfileId, 10),
      dto,
    );
  }

  @Post('months/:plan/workers/:workerProfileId/review')
  @Roles(Role.ADMIN, Role.PM, Role.MASTER)
  reviewWorkerPlanPost(
    @Req() req: any,
    @Param('plan') plan: string,
    @Param('workerProfileId') workerProfileId: string,
    @Body() dto: ReviewGardensPlanDto,
  ) {
    return this.gardens.reviewWorkerPlan(
      req.user,
      plan,
      Number.parseInt(workerProfileId, 10),
      dto,
    );
  }

  @Post('months/:plan/reminders')
  @Roles(Role.ADMIN, Role.PM, Role.MASTER)
  sendReminders(
    @Req() req: any,
    @Param('plan') plan: string,
    @Body() dto: SendGardensRemindersDto,
  ) {
    return this.gardens.sendReminders(req.user, plan, dto);
  }

  @Get('workers')
  @Roles(Role.ADMIN, Role.PM, Role.MASTER)
  listWorkers(@Req() req: any) {
    return this.gardens.listWorkers(req.user);
  }

  @Get('me/dashboard')
  @Roles(Role.TECH)
  getWorkerDashboard(@Req() req: any) {
    return this.gardens.getWorkerDashboard(req.user);
  }

  @Get('me/current')
  @Roles(Role.TECH)
  getCurrentWorkerMonth(@Req() req: any) {
    return this.gardens.getCurrentWorkerMonth(req.user);
  }

  @Get('me/months/:plan')
  @Roles(Role.TECH)
  getWorkerMonth(@Req() req: any, @Param('plan') plan: string) {
    return this.gardens.getWorkerMonth(req.user, plan);
  }

  @Put('me/months/:plan')
  @Roles(Role.TECH)
  saveAssignments(
    @Req() req: any,
    @Param('plan') plan: string,
    @Body() dto: SaveGardensAssignmentsDto,
  ) {
    return this.gardens.saveWorkerAssignments(req.user, plan, dto.assignments);
  }

  @Put('me/months/:plan/assignments')
  @Roles(Role.TECH)
  saveAssignmentsAlias(
    @Req() req: any,
    @Param('plan') plan: string,
    @Body() dto: SaveGardensAssignmentsDto,
  ) {
    return this.gardens.saveWorkerAssignments(req.user, plan, dto.assignments);
  }

  @Post('me/months/:plan/submit')
  @Roles(Role.TECH)
  submitWorkerPlan(@Req() req: any, @Param('plan') plan: string) {
    return this.gardens.submitWorkerPlan(req.user, plan);
  }
}
