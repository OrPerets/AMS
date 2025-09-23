import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { BudgetService } from './budget.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

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
}
