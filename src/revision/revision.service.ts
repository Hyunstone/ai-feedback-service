import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { serializedReturn } from 'src/common/type/common.mapper';
import { SubmissionRepository } from 'src/submission/submission.repository';
import {
  LogIdProperites,
  SubmissionStatus,
} from 'src/submission/submission.type';
import { RevisionRepository } from './revision.repository';
import { CreateRevisionDto, FindRevisionsQueryDto } from './revision.type';
import { SubmissionService } from 'src/submission/submission.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RevisionService {
  constructor(
    private readonly submissionService: SubmissionService,
    private readonly submissionRepository: SubmissionRepository,
    private readonly revisionRepository: RevisionRepository,
    private readonly prisma: PrismaService,
  ) {}
  private readonly logger = new Logger(RevisionService.name);

  async createRevision({ submissionId }: CreateRevisionDto) {
    const traceId = uuidv4();
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
      const submission = await this.submissionRepository.findSubmissionById(
        Number(submissionId),
      );
      const logIdProperties: LogIdProperites = {
        traceId,
        studentId: Number(submission.studentId),
        submissionId,
        startTime: Date.now(),
      };
      await this.submissionService.evaluateSubmission(
        Number(submission.id),
        logIdProperties,
      );

      await this.submissionRepository.updateSubmissionStatus(
        Number(submissionId),
        SubmissionStatus.PROCESSING,
        tx,
      );
      await this.revisionRepository.createRevision(
        Number(submissionId),
        null,
        tx,
      );
    });

    await this.submissionRepository.updateSubmissionStatus(
      Number(submissionId),
      SubmissionStatus.COMPLETED,
    );
  }

  async findAllRevisions(query: FindRevisionsQueryDto) {
    const { page = 1, size = 20, sort = 'createdAt,DESC' } = query;
    const [sortField, sortOrder] = sort.split(',');

    const safeSortField = ['id', 'createdAt'].includes(sortField)
      ? sortField
      : 'createdAt';
    const safeSortOrder = sortOrder?.toLowerCase() === 'asc' ? 'asc' : 'desc';

    const [data, total] = await Promise.all([
      this.revisionRepository.findAll({
        skip: (page - 1) * size,
        take: size,
        orderBy: {
          [safeSortField]: safeSortOrder,
        },
      }),
      this.revisionRepository.count(),
    ]);

    return serializedReturn({
      page,
      size,
      total,
      data,
    });
  }

  async findRevisionById(id: number) {
    const revision = await this.revisionRepository.findById(id);

    if (!revision) {
      throw new NotFoundException('Revision not found');
    }

    return serializedReturn(revision);
  }
}
