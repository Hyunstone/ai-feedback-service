import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { endOfWeek, startOfMonth, startOfWeek } from 'date-fns';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { RevisionRepository } from 'src/revision/revision.repository';
import { SubmissionRepository } from 'src/submission/submission.repository';
import { SubmissionService } from 'src/submission/submission.service';
import { LogIdProperites } from 'src/submission/submission.type';
import { v4 as uuidv4 } from 'uuid';
import { SchedulerRepository } from './scheduler.repository';

@Injectable()
export class SchedulerService {
  constructor(
    private readonly submissionSerivce: SubmissionService,
    private readonly schedulerRepository: SchedulerRepository,
    private readonly submissionRepository: SubmissionRepository,
    private readonly revisionRepository: RevisionRepository,
    private readonly prisma: PrismaService,
  ) {}
  private readonly logger = new Logger(SchedulerService.name);

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDailyStats() {
    this.logger.log('🏃‍♂️ Daily stats job started');

    const { success, failure } =
      await this.schedulerRepository.countSubmissionStats();
    await this.schedulerRepository.saveDailyStats({
      successCnt: success,
      failureCnt: failure,
    });

    this.logger.log('Daily stats job completed');
  }

  @Cron('0 0 * * 0') // 매주 일요일 0시
  async handleWeeklyStats() {
    this.logger.log('Weekly stats job started');

    const { success, failure } =
      await this.schedulerRepository.countSubmissionStats();
    const now = new Date();
    const startDate = startOfWeek(now, { weekStartsOn: 0 });
    const endDate = endOfWeek(now, { weekStartsOn: 0 });

    await this.schedulerRepository.saveWeeklyStats(
      { successCnt: success, failureCnt: failure },
      startDate,
      endDate,
    );

    this.logger.log('Weekly stats job completed');
  }

  @Cron('0 0 1 * *') // 매월 1일 0시
  async handleMonthlyStats() {
    this.logger.log('Monthly stats job started');

    const { success, failure } =
      await this.schedulerRepository.countSubmissionStats();
    const now = startOfMonth(new Date());

    await this.schedulerRepository.saveMonthlyStats(
      { successCnt: success, failureCnt: failure },
      now,
    );

    this.logger.log('Monthly stats job completed');
  }

  @Cron(CronExpression.EVERY_HOUR)
  async handleAutoRetry() {
    const traceId = uuidv4();
    this.logger.log('Auto-Retry Job started');

    const failedSubmissions =
      await this.submissionRepository.findFailedSubmissions();

    for (const submission of failedSubmissions) {
      const submissionId = Number(submission.id);

      await this.prisma.$transaction(async (tx) => {
        const submission =
          await this.submissionRepository.findSubmissionById(submissionId);

        const logIdProperties: LogIdProperites = {
          traceId,
          studentId: Number(submission.studentId),
          submissionId,
          startTime: Date.now(),
        };

        let retryResult;
        try {
          await this.submissionSerivce.evaluateSubmission(
            submissionId,
            logIdProperties,
          );

          await this.submissionRepository.updateSubmissionStatus(
            submissionId,
            'COMPLETED',
            tx,
          );

          retryResult = true;
        } catch (e) {
          this.logger.error(`Error during auto-retry: ${e.message}`);
          await this.submissionRepository.updateSubmissionStatus(
            submissionId,
            'FAILED',
            tx,
          );
          retryResult = false;
        }

        await this.revisionRepository.createRevision(
          submissionId,
          retryResult,
          tx,
        );
      });

      this.logger.log(
        `Auto-Retry Job completed. Tried: ${failedSubmissions.length} submissions`,
      );
    }
  }
}
