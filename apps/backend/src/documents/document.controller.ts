import { Body, Controller, Delete, Get, Param, Post, Put, Query, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { DocumentService } from './document.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

function ensureUploadsDir() {
  const dir = join(__dirname, '..', '..', 'uploads');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  return dir;
}

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
  findAll(@Query('search') search?: string, @Query('type') type?: string, @Query('buildingId') buildingId?: string) {
    return this.documents.findAll({ search, type, buildingId: buildingId ? +buildingId : undefined });
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

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: (_req, _file, cb) => cb(null, ensureUploadsDir()),
      filename: (_req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, unique + extname(file.originalname));
      },
    }),
    limits: { fileSize: 20 * 1024 * 1024 },
  }))
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: Omit<CreateDocumentDto, 'url' | 'name'> & { name?: string }
  ) {
    const url = `/uploads/${file.filename}`;
    const name = dto.name ?? file.originalname;
    return this.documents.create({ ...dto, url, name, fileSize: file.size, mimeType: file.mimetype });
  }

  @Post(':id/share')
  share(
    @Param('id') id: string,
    @Body() body: { userId: number; permission?: 'VIEW' | 'DOWNLOAD' | 'EDIT' | 'DELETE'; expiresAt?: string }
  ) {
    return this.documents.share(+id, { userId: body.userId, permission: body.permission, expiresAt: body.expiresAt });
  }

  @Get(':id/shares')
  listShares(@Param('id') id: string) {
    return this.documents.listShares(+id);
  }

  @Post(':id/version')
  createVersion(
    @Param('id') id: string,
    @Body() dto: Partial<UpdateDocumentDto> & { url: string; name?: string }
  ) {
    return this.documents.createVersion(+id, dto);
  }
}
