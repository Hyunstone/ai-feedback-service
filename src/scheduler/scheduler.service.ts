import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { endOfWeek, startOfMonth, startOfWeek } from 'date-fns';
import { SchedulerRepository } from './scheduler.repository';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(private readonly schedulerRepository: SchedulerRepository) {}

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
}
