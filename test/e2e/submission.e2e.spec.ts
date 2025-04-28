import 'reflect-metadata';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
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

async function getAccessToken(
  app: INestApplication,
  student: { name: string },
) {
  const response = await request(app.getHttpServer())
    .post('/v1/auth/login')
    .send({ name: student.name })
    .expect(201);

  return response.body.accessToken;
}
