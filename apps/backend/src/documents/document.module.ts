import { Module } from '@nestjs/common';
import { DocumentService } from './document.service';
import { DocumentController } from './document.controller';
import { PrismaService } from '../prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';

@Module({
  providers: [PrismaService, DocumentService, JwtAuthGuard, RolesGuard],
  controllers: [DocumentController],
  exports: [DocumentService],
})
export class DocumentModule {}
