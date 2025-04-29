import { PrismaService } from 'src/common/prisma/prisma.service';
import { RevisionRepository } from './revision.repository';
import { RevisionService } from './revision.service';
import { SubmissionModule } from 'src/submission/submission.module';
import { Module } from '@nestjs/common';
import { RevisionController } from './revision.controller';

@Module({
  imports: [SubmissionModule],
  controllers: [RevisionController],
  providers: [RevisionService, PrismaService, RevisionRepository],
  exports: [RevisionRepository],
})
export class RevisionModule {}
