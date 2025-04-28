import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { SubmissionStatus } from 'src/submission/submission.type';
import { CreateRevisionDto } from './revision.type';
import { RevisionRepository } from './revision.repository';
import { SubmissionRepository } from 'src/submission/submission.repository';

@Injectable()
export class RevisionService {
  constructor(
    private readonly submissionRepository: SubmissionRepository,
    private readonly revisionRepository: RevisionRepository,
    private readonly prisma: PrismaService,
  ) {}
  private readonly logger = new Logger(RevisionService.name);

  async createRevision({ submissionId }: CreateRevisionDto) {
    const submission = await this.submissionRepository.findSubmissionById(
      Number(submissionId),
    );

    if (!submission) {
      throw new NotFoundException('Submission not found');
    }

    if (submission.status === SubmissionStatus.PROCESSING) {
      throw new ConflictException('Submission is already being processed');
    }
    await this.prisma.$transaction(async (tx) => {
      await this.submissionRepository.updateSubmissionStatus(
        Number(submissionId),
        SubmissionStatus.PROCESSING,
        tx,
      );
      await this.revisionRepository.createRevision(Number(submissionId), tx);
    });
  }
}
