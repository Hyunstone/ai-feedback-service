import { Module } from '@nestjs/common';
import { SubmissionController } from './submission.controller';
import { SubmissionService } from './submission.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { SubmissionRepository } from './submission.repository';
import { AzureOpenAIService } from 'src/common/openai/openai.service';

@Module({
  controllers: [SubmissionController],
  providers: [
    SubmissionService,
    PrismaService,
    AzureOpenAIService,
    SubmissionRepository,
  ],
  exports: [SubmissionRepository],
})
export class SubmissionModule {}
