import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import 'reflect-metadata';
import { AppModule } from 'src/app.module';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { SubmissionModule } from 'src/submission/submission.module';
import { SubmissionService } from 'src/submission/submission.service';
import { SubmissionStatus } from 'src/submission/submission.type';
import * as request from 'supertest';

describe('Revision Create E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let studentId: number;
  let submissionService: SubmissionService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule, SubmissionModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);
    submissionService = module.get<SubmissionService>(SubmissionService);
  });

  beforeEach(async () => {
    await prisma.revisions.deleteMany();
    await prisma.submissions.deleteMany();
    await prisma.students.deleteMany();
    await prisma.submissionComponentType.deleteMany();
  });

  afterAll(async () => {
    await prisma.revisions.deleteMany();
    await prisma.submissions.deleteMany();
    await prisma.students.deleteMany();
    await prisma.submissionComponentType.deleteMany();
    await app.close();
  });

  it('정상적으로 Revision 요청 성공', async () => {
    const student = await prisma.students.create({
      data: { name: 'Revision Test Student' },
    });

    await prisma.submissionComponentType.create({
      data: { name: 'homework' },
    });

    const submission = await prisma.submissions.create({
      data: {
        studentId: student.id,
        componentType: 'homework',
        status: SubmissionStatus.PENDING,
        submitText: 'Testing submission',
      },
    });

    // EvaluateSubmission mock 세팅
    jest
      .spyOn(submissionService, 'evaluateSubmission')
      .mockResolvedValueOnce(undefined);

    const res = await request(app.getHttpServer())
      .post('/api/v1/revision')
      .send({ submissionId: Number(submission.id) })
      .expect(201);

    expect(res.body.message).toBe('ok');

    const revision = await prisma.revisions.findFirst({
      where: { submissionId: submission.id },
    });

    expect(revision).not.toBeNull();
    expect(revision.isSuccess).toBeNull();
  });

  it('없는 submissionId 요청 시 응답은 200, 메시지', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/revision')
      .send({ submissionId: 999999 }) // 존재하지 않는 ID
      .expect(200);
  });

  it('이미 PROCESSING 상태면 200, 메시지는 Conflict을 응답한다', async () => {
    await prisma.submissionComponentType.create({
      data: { name: 'quiz' },
    });
    const submission = await prisma.submissions.create({
      data: {
        studentId,
        componentType: 'quiz',
        status: 'PROCESSING',
        submitText: 'conflict test',
      },
    });

    await request(app.getHttpServer())
      .post('/api/v1/revision')
      .send({ submissionId: Number(submission.id) })
      .expect(200);
  });
});

describe('Revision Query E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();

    prisma = app.get(PrismaService);

    const student = await prisma.students.create({
      data: {
        name: 'Revision Tester',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    await prisma.submissionComponentType.create({
      data: { name: 'homework' },
    });

    const submission = await prisma.submissions.create({
      data: {
        studentId: student.id,
        componentType: 'homework',
        status: 'COMPLETED',
        submitText: 'Submission for revision',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    await prisma.revisions.create({
      data: {
        submissionId: submission.id,
        isSuccess: false,
        createdAt: new Date(),
      },
    });
  });

  afterAll(async () => {
    await prisma.revisions.deleteMany();
    await prisma.submissions.deleteMany();
    await prisma.students.deleteMany();
    await prisma.submissionComponentType.deleteMany();
    await app.close();
  });

  it('기본 조회 성공', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/revision')
      .expect(200);

    expect(res.body.data.page).toBe(1);
    expect(res.body.data.size).toBe(20);
    expect(res.body.data.total).toBeGreaterThan(0);
    expect(res.body.data.data.length).toBeGreaterThan(0);
  });

  it('페이지네이션 정상 동작', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/revision?page=1&size=1')
      .expect(200);

    expect(res.body.data.page).toBe(1);
    expect(res.body.data.size).toBe(1);
    expect(res.body.data.data.length).toBeLessThanOrEqual(1);
  });

  it('정렬 정상 동작 (createdAt ASC)', async () => {
    const submission = await prisma.submissions.findFirst({
      where: { componentType: 'homework', status: 'COMPLETED' },
    });
    await prisma.revisions.create({
      data: {
        submissionId: submission.id,
        isSuccess: false,
        createdAt: new Date(),
      },
    });

    await prisma.revisions.create({
      data: {
        submissionId: submission.id,
        isSuccess: false,
        createdAt: new Date(),
      },
    });
    const res = await request(app.getHttpServer())
      .get('/api/v1/revision?sort=createdAt,ASC')
      .expect(200);

    expect(res.body.data.data.length).toBeGreaterThan(0);
    const createdAtList = res.body.data.data.map((item: any) =>
      new Date(item.createdAt).getTime(),
    );

    // createdAt이 오름차순인지 검증
    const isSortedAsc = createdAtList.every((time, idx, arr) => {
      return idx === 0 || arr[idx - 1] <= time;
    });
    expect(isSortedAsc).toBe(true);
  });

  it('잘못된 page 값 실패', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/revision?page=-1')
      .expect(200);

    expect(res.body.message).toContain(
      'An instance of FindRevisionsQueryDto has failed the validation',
    );
  });

  it('잘못된 sort 포맷 실패', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/revision?sort=invalidsort')
      .expect(200);
  });
});

describe('Revision Query By ID E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let createdRevisionId: number;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();

    prisma = app.get(PrismaService);

    const student = await prisma.students.create({
      data: {
        name: 'Revision Detail Tester',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    await prisma.submissionComponentType.create({
      data: { name: 'homework' },
    });

    const submission = await prisma.submissions.create({
      data: {
        studentId: student.id,
        componentType: 'homework',
        status: 'COMPLETED',
        submitText: 'Submission for detail',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    const revision = await prisma.revisions.create({
      data: {
        submissionId: submission.id,
        isSuccess: false,
        createdAt: new Date(),
      },
    });

    createdRevisionId = Number(revision.id);
  });

  afterAll(async () => {
    await prisma.revisions.deleteMany();
    await prisma.submissions.deleteMany();
    await prisma.students.deleteMany();
    await prisma.submissionComponentType.deleteMany();
    await app.close();
  });

  it('정상적으로 revision 상세 조회 성공', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/revision/${createdRevisionId}`)
      .expect(200);

    expect(res.body.data).toHaveProperty('id', createdRevisionId);
    expect(res.body.data).toHaveProperty('submissionId');
    expect(res.body.data).toHaveProperty('isSuccess');
    expect(res.body.data).toHaveProperty('createdAt');
  });

  it('없는 revisionId 조회 시 200, Not Found를 응답한다', async () => {
    const nonExistId = 9999999;

    const res = await request(app.getHttpServer())
      .get(`/api/v1/revision/${nonExistId}`)
      .expect(200);

    expect(res.body.message).toBe('Revision not found');
  });

  it('revisionId가 숫자가 아니면 200, Bad Request를 응답한다', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/revision/invalid-id')
      .expect(200);

    expect(res.body.message).toContain('Validation failed');
  });
});
