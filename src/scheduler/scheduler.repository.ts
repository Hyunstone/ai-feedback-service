import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';

@Injectable()
export class SchedulerRepository {
  constructor(private readonly prisma: PrismaService) {}

  async countSubmissionStats() {
    const total = await this.prisma.submissions.count();
    const success = await this.prisma.submissions.count({
      where: { status: 'COMPLETED' },
    });
    const failure = await this.prisma.submissions.count({
      where: { status: 'FAILED' },
    });

    return { total, success, failure };
  }

  async saveDailyStats({
    successCnt,
    failureCnt,
  }: {
    successCnt: number;
    failureCnt: number;
  }) {
    return this.prisma.statsDaily.create({
      data: {
        name: 'submissions',
        date: new Date(),
        successCnt,
        failureCnt,
      },
    });
  }

  async saveWeeklyStats(
    { successCnt, failureCnt }: { successCnt: number; failureCnt: number },
    startDate: Date,
    endDate: Date,
  ) {
    return this.prisma.statsWeekly.create({
      data: {
        name: 'submissions',
        startDate,
        endDate,
        successCnt,
        failureCnt,
      },
    });
  }

  async saveMonthlyStats(
    { successCnt, failureCnt }: { successCnt: number; failureCnt: number },
    date: Date,
  ) {
    return this.prisma.statsMonthly.create({
      data: {
        name: 'submissions',
        date,
        successCnt,
        failureCnt,
      },
    });
  }
}
