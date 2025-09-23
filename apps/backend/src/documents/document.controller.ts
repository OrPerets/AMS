import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { DocumentService } from './document.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('api/v1/documents')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.PM, Role.TECH, Role.ACCOUNTANT)
export class DocumentController {
  constructor(private documents: DocumentService) {}

  @Post()
  create(@Body() dto: CreateDocumentDto) {
    return this.documents.create(dto);
  }

  @Get()
  findAll() {
    return this.documents.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.documents.findOne(+id);
  }

  @Get('building/:buildingId')
  findForBuilding(@Param('buildingId') buildingId: string) {
    return this.documents.findForBuilding(+buildingId);
  }

  @Get('unit/:unitId')
  findForUnit(@Param('unitId') unitId: string) {
    return this.documents.findForUnit(+unitId);
  }

  @Get('asset/:assetId')
  findForAsset(@Param('assetId') assetId: string) {
    return this.documents.findForAsset(+assetId);
  }

  @Get('contract/:contractId')
  findForContract(@Param('contractId') contractId: string) {
    return this.documents.findForContract(+contractId);
  }

  @Get('expense/:expenseId')
  findForExpense(@Param('expenseId') expenseId: string) {
    return this.documents.findForExpense(+expenseId);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateDocumentDto) {
    return this.documents.update(+id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.documents.remove(+id);
  }
}
