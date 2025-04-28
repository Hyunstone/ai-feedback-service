import 'reflect-metadata';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import { PrismaService } from 'src/common/prisma/prisma.service';
import * as request from 'supertest';
import { GlobalExceptionsFilter } from 'src/common/exception/exception.filter';

describe('Revision E2E', () => {
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
