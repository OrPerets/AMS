import { BadRequestException, Body, Controller, Delete, Get, Param, Post, Put, Query, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { DocumentService } from './document.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/roles.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { buildUploadFilename, documentUploadOptions, ensureUploadsDir } from '../uploads/upload.utils';

function normalizeDocumentPayload(input: Record<string, unknown>) {
  const tags = input.tags ?? input['tags[]'];
  const normalizedTags = Array.isArray(tags)
    ? tags.map((value) => String(value))
    : typeof tags === 'string' && tags.length > 0
      ? [tags]
      : undefined;

  return {
    ...input,
    name: typeof input.name === 'string' ? input.name : undefined,
    tags: normalizedTags,
    buildingId: input.buildingId ? Number(input.buildingId) : undefined,
    unitId: input.unitId ? Number(input.unitId) : undefined,
    contractId: input.contractId ? Number(input.contractId) : undefined,
    assetId: input.assetId ? Number(input.assetId) : undefined,
    expenseId: input.expenseId ? Number(input.expenseId) : undefined,
    uploadedById: input.uploadedById ? Number(input.uploadedById) : undefined,
    fileSize: input.fileSize ? Number(input.fileSize) : undefined,
  };
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
    ...documentUploadOptions,
    storage: diskStorage({
      destination: (_req, _file, cb) => cb(null, ensureUploadsDir()),
      filename: (_req, file, cb) => cb(null, buildUploadFilename(file.originalname, file.mimetype)),
    }),
  }))
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: Record<string, unknown>
  ) {
    if (!file) {
      throw new BadRequestException('A file is required.');
    }
    const payload = normalizeDocumentPayload(dto);
    const url = `/uploads/${file.filename}`;
    const name = typeof payload.name === 'string' ? payload.name : file.originalname;
    return this.documents.create({ ...payload, url, name, fileSize: file.size, mimeType: file.mimetype });
  }

  @Post(':id/version/upload')
  @UseInterceptors(FileInterceptor('file', {
    ...documentUploadOptions,
    storage: diskStorage({
      destination: (_req, _file, cb) => cb(null, ensureUploadsDir()),
      filename: (_req, file, cb) => cb(null, buildUploadFilename(file.originalname, file.mimetype)),
    }),
  }))
  uploadVersion(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: Record<string, unknown>
  ) {
    if (!file) {
      throw new BadRequestException('A file is required.');
    }
    const payload = normalizeDocumentPayload(dto);
    const url = `/uploads/${file.filename}`;
    return this.documents.createVersion(+id, {
      ...payload,
      url,
      name: typeof payload.name === 'string' ? payload.name : file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
    });
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
