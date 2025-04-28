import 'reflect-metadata';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import { PrismaService } from 'src/common/prisma/prisma.service';
import * as request from 'supertest';
import { GlobalExceptionsFilter } from 'src/common/exception/exception.filter';

describe('Revision Create E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let studentId: number;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    app.useGlobalFilters(new GlobalExceptionsFilter());
    await app.init();

    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await prisma.revisions.deleteMany();
    await prisma.submissions.deleteMany();
    await prisma.students.deleteMany();
    await prisma.submissionComponentType.deleteMany();
    await app.close();
  });

  it('정상적으로 Revision 요청 성공', async () => {
    await prisma.submissionComponentType.create({
      data: { name: 'homework' },
    });
    const submission = await prisma.submissions.create({
      data: {
        studentId,
        componentType: 'homework',
        status: 'PENDING',
        submitText: 'revision test',
      },
    });

    const res = await request(app.getHttpServer())
      .post('/api/v1/revision')
      .send({ submissionId: Number(submission.id) })
      .expect(201);

    expect(res.body.message).toBe('Revision request submitted successfully');

    const updatedSubmission = await prisma.submissions.findUnique({
      where: { id: submission.id },
    });
    const revision = await prisma.revisions.findFirst({
      where: { submissionId: submission.id },
    });

    expect(updatedSubmission.status).toBe('PROCESSING');
    expect(revision).not.toBeNull();
  });

  it('없는 submissionId 요청 시 404', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/revision')
      .send({ submissionId: 999999 }) // 존재하지 않는 ID
      .expect(404);
  });

  it('이미 PROCESSING 상태면 409 Conflict', async () => {
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
      .expect(409);
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

    console.log(res.body);

    expect(res.body.page).toBe(1);
    expect(res.body.size).toBe(20);
    expect(res.body.total).toBeGreaterThan(0);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('페이지네이션 정상 동작', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/revision?page=1&size=1')
      .expect(200);

    expect(res.body.page).toBe(1);
    expect(res.body.size).toBe(1);
    expect(res.body.data.length).toBeLessThanOrEqual(1);
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

    expect(res.body.data.length).toBeGreaterThan(0);
    const createdAtList = res.body.data.map((item: any) =>
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
      .expect(400);

    expect(res.body.message).toContain('page must not be less than 1');
  });

  it('잘못된 sort 포맷 실패', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/revision?sort=invalidsort')
      .expect(200);
  });
});
