import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards, Query } from '@nestjs/common';
import { BudgetService } from './budget.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { Request } from 'express';
import { Req } from '@nestjs/common';

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
  addExpenseToBudget(@Param('id') id: string, @Body() dto: CreateExpenseDto) {
    return this.budgets.addExpense({ ...dto, budgetId: +id });
  }

  @Post('expenses')
  addExpense(@Body() dto: CreateExpenseDto) {
    return this.budgets.addExpense(dto);
  }

  @Get('building/:buildingId/summary')
  getSummary(@Param('buildingId') buildingId: string) {
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
  approveExpense(@Param('expenseId') expenseId: string, @Req() req: Request) {
    const userId = (req as any).user?.userId as number | undefined;
    return this.budgets.approveExpense(+expenseId, userId);
  }

  @Post('expenses/:expenseId/reject')
  @Roles(Role.ADMIN, Role.ACCOUNTANT)
  rejectExpense(@Param('expenseId') expenseId: string, @Req() req: Request) {
    const userId = (req as any).user?.userId as number | undefined;
    return this.budgets.rejectExpense(+expenseId, userId);
  }
}
