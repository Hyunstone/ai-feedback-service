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

    // 테스트용 데이터 삽입
    const student = await prisma.students.create({
      data: {
        name: 'E2E Student',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    await prisma.submissionComponentType.create({
      data: { name: 'homework' },
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
  });

  afterAll(async () => {
    await prisma.submissions.deleteMany();
    await prisma.students.deleteMany();
    await prisma.submissionComponentType.deleteMany();
    await app.close();
  });

  // ✅ 성공 케이스
  it('기본 조회 성공', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/submissions?page=1&size=10')
      .expect(200);

    expect(res.body.page).toBe(1);
    expect(res.body.size).toBe(10);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('status 필터 성공', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/submissions?status=PENDING')
      .expect(200);

    expect(res.body.data.every((item: any) => item.status === 'PENDING')).toBe(
      true,
    );
  });

  it('studentId 검색 성공', async () => {
    const student = await prisma.students.findFirst({
      where: { name: 'E2E Student' },
    });

    const res = await request(app.getHttpServer())
      .get(`/api/v1/submissions?studentId=${student?.id}`)
      .expect(200);

    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].studentId).toBe(Number(student?.id));
  });

  it('studentName 검색 성공', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/submissions?studentName=E2E`)
      .expect(200);

    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].student.name).toContain('E2E');
  });

  it('sort 파라미터 변경 성공', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/submissions?sort=createdAt,ASC`)
      .expect(200);

    expect(res.body.data.length).toBeGreaterThan(0);
  });

  // ❌ 실패 케이스
  it('잘못된 status 필터 실패', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/submissions?status=INVALID_STATUS')
      .expect(400);

    expect(res.body.message).toContain(
      'status must be one of the following values: PENDING, PROCESSING, COMPLETED, FAILED',
    );
  });

  it('음수 page 요청 실패', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/submissions?page=-1')
      .expect(400);

    expect(res.body.message).toContain('page must not be less than 1');
  });

  it('잘못된 sort 포맷 실패', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/submissions?sort=invalidformat')
      .expect(400);
  });
});
