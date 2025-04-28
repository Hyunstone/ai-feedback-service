import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import 'reflect-metadata';
import { AppModule } from 'src/app.module';
import { GlobalExceptionsFilter } from 'src/common/exception/exception.filter';
import { PrismaService } from 'src/common/prisma/prisma.service';
import * as request from 'supertest';

describe('Submissions E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    app.useGlobalFilters(new GlobalExceptionsFilter());
    await app.init();

    prisma = app.get(PrismaService);

    await prisma.submissionComponentType.create({
      data: { name: 'homework' },
    });
  });

  afterAll(async () => {
    await prisma.submissions.deleteMany();
    await prisma.students.deleteMany();
    await prisma.submissionComponentType.deleteMany();
    await app.close();
  });

  // ✅ 성공 케이스
  it('기본 조회 성공', async () => {
    const student = await createTestSetting(prisma);
    const tokenRequest = {
      name: student.name,
    };
    const token = await getAccessToken(app, tokenRequest);
    const res = await request(app.getHttpServer())
      .get('/api/v1/submissions?page=1&size=10')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.page).toBe(1);
    expect(res.body.size).toBe(10);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('status 필터 성공', async () => {
    const student = await createTestSetting(prisma);
    const tokenRequest = {
      name: student.name,
    };
    const token = await getAccessToken(app, tokenRequest);
    const res = await request(app.getHttpServer())
      .get('/api/v1/submissions?status=PENDING')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.data.every((item: any) => item.status === 'PENDING')).toBe(
      true,
    );
  });

  it('studentId 검색 성공', async () => {
    const student = await createTestSetting(prisma);
    const tokenRequest = {
      name: student.name,
    };
    const token = await getAccessToken(app, tokenRequest);
    const res = await request(app.getHttpServer())
      .get(`/api/v1/submissions?studentId=${student.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].studentId).toBe(Number(student.id));
  });

  it('studentName 검색 성공', async () => {
    const student = await createTestSetting(prisma);
    const tokenRequest = {
      name: student.name,
    };
    const token = await getAccessToken(app, tokenRequest);
    const res = await request(app.getHttpServer())
      .get(`/api/v1/submissions?studentName=E2E`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].student.name).toContain('E2E');
  });

  it('sort 파라미터 변경 성공', async () => {
    const student = await createTestSetting(prisma);
    const tokenRequest = {
      name: student.name,
    };
    const token = await getAccessToken(app, tokenRequest);
    const res = await request(app.getHttpServer())
      .get(`/api/v1/submissions?sort=createdAt,ASC`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.data.length).toBeGreaterThan(0);
  });

  // ❌ 실패 케이스
  it('토큰 없이 호출하면 401 Unauthorized 응답한다', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/submissions')
      .expect(401);

    expect(res.body.message).toBe('Unauthorized');
  });

  it('잘못된 토큰으로 호출하면 401 Unauthorized 응답한다', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/submissions')
      .set('Authorization', 'Bearer invalidtoken')
      .expect(401);

    expect(res.body.message).toBe('Unauthorized');
  });

  it('잘못된 status 필터 실패', async () => {
    const student = await createTestSetting(prisma);
    const tokenRequest = {
      name: student.name,
    };
    const token = await getAccessToken(app, tokenRequest);
    const res = await request(app.getHttpServer())
      .get('/api/v1/submissions?status=INVALID_STATUS')
      .set('Authorization', `Bearer ${token}`)
      .expect(400);

    expect(res.body.message).toContain(
      'status must be one of the following values: PENDING, PROCESSING, COMPLETED, FAILED',
    );
  });

  it('음수 page 요청 실패', async () => {
    const student = await createTestSetting(prisma);
    const tokenRequest = {
      name: student.name,
    };
    const token = await getAccessToken(app, tokenRequest);
    const res = await request(app.getHttpServer())
      .get('/api/v1/submissions?page=-1')
      .set('Authorization', `Bearer ${token}`)
      .expect(400);

    expect(res.body.message).toContain('page must not be less than 1');
  });

  it('잘못된 sort 포맷 실패', async () => {
    const student = await createTestSetting(prisma);
    const tokenRequest = {
      name: student.name,
    };
    const token = await getAccessToken(app, tokenRequest);
    await request(app.getHttpServer())
      .get('/api/v1/submissions?sort=invalidformat')
      .set('Authorization', `Bearer ${token}`)
      .expect(400);
  });
});

async function createTestSetting(prisma: PrismaService) {
  const student = await prisma.students.create({
    data: {
      name: 'E2E Student',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  await prisma.submissions.create({
    data: {
      studentId: student.id,
      componentType: 'homework',
      status: 'PENDING',
      submitText: 'E2E Test Text',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  return student;
}

describe('Submission Detail E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;
  let student: any;
  let submission: any;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();

    prisma = app.get(PrismaService);

    student = await prisma.students.create({
      data: {
        name: 'E2E Submission Detail Tester',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    await prisma.submissionComponentType.create({
      data: { name: 'homework' },
    });

    submission = await prisma.submissions.create({
      data: {
        studentId: student.id,
        componentType: 'homework',
        status: 'PENDING',
        submitText: 'This is a submission detail test',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    const analysis = await prisma.submissionsAnalysis.create({
      data: {
        submissionId: submission.id,
        score: 85,
        feedback: 'Good job!',
        highlightSubmitText: '<b>hello<b>. <b>highlighted text<b>',
        createdAt: new Date(),
      },
    });

    await prisma.analysisHighlights.create({
      data: {
        submissionAnalysisId: analysis.id,
        text: 'hello',
      },
    });

    await prisma.analysisHighlights.create({
      data: {
        submissionAnalysisId: analysis.id,
        text: 'highlighted text',
      },
    });

    await prisma.submissionMedia.create({
      data: {
        submissionId: submission.id,
        type: 'video',
        url: 'https://example.com/video.mp4',
        createdAt: new Date(),
      },
    });

    await prisma.submissionMedia.create({
      data: {
        submissionId: submission.id,
        type: 'audio',
        url: 'https://example.com/audio.mp3',
        createdAt: new Date(),
      },
    });
  });

  afterAll(async () => {
    await prisma.submissions.deleteMany();
    await prisma.submissionComponentType.deleteMany();
    await prisma.students.deleteMany();
    await app.close();
  });

  it('submissionId로 상세 조회 성공', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/submissions/${submission.id}`)
      .expect(200);

    expect(res.body).toHaveProperty('id', Number(submission.id));
    expect(res.body).toHaveProperty('componentType', submission.componentType);
    expect(res.body).toHaveProperty('status', submission.status);
    expect(res.body).toHaveProperty('submitText', submission.submitText);
    expect(res.body).toHaveProperty('createdAt');
    expect(res.body.student).toHaveProperty('name', student.name);

    // analysis 검증
    if (res.body.analysis) {
      expect(res.body.analysis).toHaveProperty('score');
      expect(res.body.analysis).toHaveProperty('feedback');
      expect(res.body.analysis).toHaveProperty('highlightSubmitText');
      expect(Array.isArray(res.body.analysis.highlights)).toBe(true);
    }

    // media 검증
    if (res.body.media) {
      expect(Array.isArray(res.body.media)).toBe(true);
      if (res.body.media.length > 0) {
        expect(res.body.media[0]).toHaveProperty('url');
        expect(res.body.media[0]).toHaveProperty('type');
        expect(res.body.media[0]).toHaveProperty('createdAt');
      }
    }
  });

  it('없는 submissionId로 조회하면 404 반환', async () => {
    const fakeSubmissionId = 99999999;

    await request(app.getHttpServer())
      .get(`/api/v1/submissions/${fakeSubmissionId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(404);
  });
});

async function getAccessToken(
  app: INestApplication,
  student: { name: string },
) {
  const response = await request(app.getHttpServer())
    .post('/api/v1/auth/login')
    .send({ name: student.name })
    .expect(201);

  return response.body.accessToken;
}
