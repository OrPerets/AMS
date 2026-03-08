import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards, Query, Res } from '@nestjs/common';
import { BudgetService } from './budget.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/roles.decorator';
import { Request } from 'express';
import { Req } from '@nestjs/common';
import { Response } from 'express';

@Controller('api/v1/budgets')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.PM, Role.ACCOUNTANT)
export class BudgetController {
  constructor(private budgets: BudgetService) {}

  @Post()
  create(@Body() dto: CreateBudgetDto) {
    return this.budgets.create(dto);
  }

  @Get()
  findAll() {
    return this.budgets.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.budgets.findOne(+id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateBudgetDto) {
    return this.budgets.update(+id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.budgets.remove(+id);
  }

  @Post(':id/expenses')
  addExpenseToBudget(@Param('id') id: string, @Body() dto: CreateExpenseDto, @Req() req: Request) {
    return this.budgets.addExpense({ ...dto, budgetId: +id }, (req as any).user?.sub);
  }

  @Post('expenses')
  addExpense(@Body() dto: CreateExpenseDto, @Req() req: Request) {
    return this.budgets.addExpense(dto, (req as any).user?.sub);
  }

  @Get('building/:buildingId/summary')
  async getSummary(
    @Param('buildingId') buildingId: string,
    @Query('format') format?: string,
    @Res({ passthrough: true }) res?: Response,
  ) {
    if (format === 'csv' && res) {
      const csv = await this.budgets.exportSummaryCsv(+buildingId);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="budget-summary.csv"');
      return csv;
    }
    return this.budgets.getSummaryForBuilding(+buildingId);
  }

  @Get('expenses')
  listExpenses(@Query('status') status?: string) {
    return this.budgets.listExpenses(status as any);
  }

  @Post(':id/approve')
  @Roles(Role.ADMIN, Role.ACCOUNTANT)
  approve(@Param('id') id: string) {
    return this.budgets.approve(+id);
  }

  @Post(':id/reject')
  @Roles(Role.ADMIN, Role.ACCOUNTANT)
  reject(@Param('id') id: string) {
    return this.budgets.reject(+id);
  }

  @Post('expenses/:expenseId/approve')
  @Roles(Role.ADMIN, Role.ACCOUNTANT)
  approveExpense(@Param('expenseId') expenseId: string, @Body() body: { comment?: string }, @Req() req: Request) {
    const userId = (req as any).user?.sub as number | undefined;
    const role = ((req as any).user?.actAsRole ?? (req as any).user?.role) as any;
    return this.budgets.approveExpense(+expenseId, userId, role, body?.comment);
  }

  @Post('expenses/:expenseId/reject')
  @Roles(Role.ADMIN, Role.ACCOUNTANT)
  rejectExpense(@Param('expenseId') expenseId: string, @Body() body: { comment?: string }, @Req() req: Request) {
    const userId = (req as any).user?.sub as number | undefined;
    const role = ((req as any).user?.actAsRole ?? (req as any).user?.role) as any;
    return this.budgets.rejectExpense(+expenseId, userId, role, body?.comment);
  }
}
