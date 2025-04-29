import { Module } from '@nestjs/common';
import { SubmissionController } from './submission.controller';
import { SubmissionService } from './submission.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { SubmissionRepository } from './submission.repository';
import { AzureOpenAIService } from 'src/common/openai/openai.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  controllers: [SubmissionController],
  imports: [ConfigModule],
  providers: [
    SubmissionService,
    PrismaService,
    AzureOpenAIService,
    SubmissionRepository,
  ],
  exports: [SubmissionService, SubmissionRepository],
})
export class SubmissionModule {}
