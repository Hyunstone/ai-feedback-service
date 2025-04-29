import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { SchedulerModule } from 'src/scheduler/scheduler.module';
import { SchedulerService } from 'src/scheduler/scheduler.service';
import { SubmissionModule } from 'src/submission/submission.module';
import { SubmissionService } from 'src/submission/submission.service';

describe('SchedulerService', () => {
  let service: SchedulerService;
  let prisma: PrismaService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [SchedulerModule, SubmissionModule],
      providers: [PrismaService],
    }).compile();

    service = module.get<SchedulerService>(SchedulerService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  beforeEach(async () => {
    await prisma.statsDaily.deleteMany();
    await prisma.statsWeekly.deleteMany();
    await prisma.statsMonthly.deleteMany();
    await prisma.submissionComponentType.deleteMany();
  });

  afterAll(async () => {
    await prisma.statsDaily.deleteMany();
    await prisma.statsWeekly.deleteMany();
    await prisma.statsMonthly.deleteMany();
    await prisma.submissionComponentType.deleteMany();
  });

  it('Daily Job 실행 시 stats_daily에 저장된다', async () => {
    await service.handleDailyStats();

    const dailyStats = await prisma.statsDaily.findFirst();
    expect(dailyStats).not.toBeNull();
    expect(dailyStats.name).toBe('submissions');
    expect(typeof dailyStats.successCnt).toBe('number');
    expect(typeof dailyStats.failureCnt).toBe('number');
  });

  it('Weekly Job 실행 시 stats_weekly에 저장된다', async () => {
    await service.handleWeeklyStats();

    const weeklyStats = await prisma.statsWeekly.findFirst();
    expect(weeklyStats).not.toBeNull();
    expect(weeklyStats.name).toBe('submissions');
    expect(typeof weeklyStats.successCnt).toBe('number');
    expect(typeof weeklyStats.failureCnt).toBe('number');
    expect(weeklyStats.startDate).not.toBeNull();
    expect(weeklyStats.endDate).not.toBeNull();
  });

  it('Monthly Job 실행 시 stats_monthly에 저장된다', async () => {
    await service.handleMonthlyStats();

    const monthlyStats = await prisma.statsMonthly.findFirst();
    expect(monthlyStats).not.toBeNull();
    expect(monthlyStats.name).toBe('submissions');
    expect(typeof monthlyStats.successCnt).toBe('number');
    expect(typeof monthlyStats.failureCnt).toBe('number');
    expect(monthlyStats.date).not.toBeNull();
  });
});

describe('SchedulerService - AutoRetryScheduler', () => {
  let schedulerService: SchedulerService;
  let prisma: PrismaService;
  let submissionService: SubmissionService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [SchedulerModule, SubmissionModule],
      providers: [PrismaService],
    }).compile();

    schedulerService = module.get(SchedulerService);
    prisma = module.get(PrismaService);
    submissionService = module.get(SubmissionService);
  });

  beforeEach(async () => {
    await prisma.revisions.deleteMany();
    await prisma.submissions.deleteMany();
    await prisma.students.deleteMany();
    await prisma.submissionComponentType.deleteMany();
  });

  it('실패한 제출물이 있으면 재시도 후 상태 및 revision 기록', async () => {
    const student = await prisma.students.create({
      data: { name: 'Retry Student' },
    });

    await prisma.submissionComponentType.create({
      data: { name: 'homework' },
    });

    const failedSubmission = await prisma.submissions.create({
      data: {
        studentId: student.id,
        componentType: 'homework',
        status: 'FAILED',
        submitText: 'AutoRetry test',
      },
    });

    // EvaluateSubmission mock 세팅
    jest
      .spyOn(submissionService, 'evaluateSubmission')
      .mockResolvedValueOnce(undefined);

    await schedulerService.handleAutoRetry();

    const updatedSubmission = await prisma.submissions.findUnique({
      where: { id: failedSubmission.id },
    });

    const createdRevision = await prisma.revisions.findFirst({
      where: { submissionId: failedSubmission.id },
    });

    expect(updatedSubmission.status).toBe('COMPLETED');
    expect(createdRevision).not.toBeNull();
    expect(createdRevision.isSuccess).toBe(true);
  });

  it('재평가 실패 시 상태를 FAILED로 업데이트하고 revision 기록', async () => {
    const student = await prisma.students.create({
      data: { name: 'Retry Failure' },
    });

    await prisma.submissionComponentType.create({
      data: { name: 'quiz' },
    });

    const failedSubmission = await prisma.submissions.create({
      data: {
        studentId: student.id,
        componentType: 'quiz',
        status: 'FAILED',
        submitText: 'AutoRetry Fail Test',
      },
    });

    // EvaluateSubmission mock: 실패 시뮬레이션
    jest
      .spyOn(submissionService, 'evaluateSubmission')
      .mockRejectedValueOnce(new Error('Retry Fail'));

    await schedulerService.handleAutoRetry();

    const updatedSubmission = await prisma.submissions.findUnique({
      where: { id: failedSubmission.id },
    });

    const createdRevision = await prisma.revisions.findFirst({
      where: { submissionId: failedSubmission.id },
    });

    expect(updatedSubmission.status).toBe('FAILED');
    expect(createdRevision).not.toBeNull();
    expect(createdRevision.isSuccess).toBe(false);
  });
});
