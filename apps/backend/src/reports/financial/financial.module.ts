import { Module } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { FinancialService } from './financial.service';
import { FinancialController } from './financial.controller';

@Module({
  providers: [PrismaService, FinancialService],
  controllers: [FinancialController],
})
export class FinancialModule {}


