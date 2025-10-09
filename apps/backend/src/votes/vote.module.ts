import { Module } from '@nestjs/common';
import { VoteController } from './vote.controller';
import { VoteService } from './vote.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [VoteController],
  providers: [VoteService, PrismaService],
  exports: [VoteService],
})
export class VoteModule {}

