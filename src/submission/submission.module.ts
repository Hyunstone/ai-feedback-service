import { Module } from '@nestjs/common';
import { SubmissionController } from './submission.controller';
import { SubmissionService } from './submission.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { SubmissionRepository } from './submission.repository';

@Module({
  controllers: [SubmissionController],
  providers: [SubmissionService, PrismaService, SubmissionRepository],
})
export class SubmissionModule {}
