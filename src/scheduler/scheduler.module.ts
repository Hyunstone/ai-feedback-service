import { Module } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { SchedulerRepository } from './scheduler.repository';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { SubmissionModule } from 'src/submission/submission.module';
import { RevisionModule } from 'src/revision/revision.module';

@Module({
  imports: [SubmissionModule, RevisionModule],
  providers: [SchedulerService, SchedulerRepository, PrismaService],
  exports: [SchedulerService, SchedulerRepository],
})
export class SchedulerModule {}
