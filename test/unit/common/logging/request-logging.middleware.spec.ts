import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import { PrismaService } from 'src/common/prisma/prisma.service';
import * as request from 'supertest';

describe('RequestLoggingMiddleware (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let token: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
      }),
    );
    await app.init();

    prisma = app.get(PrismaService);
    await prisma.requestLogs.deleteMany();

    await prisma.students.create({
      data: {
        name: 'Middleware Test User',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  });

  beforeEach(async () => {
    await prisma.requestLogs.deleteMany();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/revision 요청 시 requestLogs에 기록된다', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/revision?page=1&size=1')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    // 비동기로 인한 잠시 대기
    await new Promise((resolve) => setTimeout(resolve, 500));
    const logs = await prisma.requestLogs.findMany({
      where: {
        uri: '/api/v1/revision?page=1&size=1',
        method: 'GET',
      },
    });

    expect(logs.length).toBeGreaterThan(0);
    const log = logs[0];
    expect(log.method).toBe('GET');
    expect(log.uri).toBe('/api/v1/revision?page=1&size=1');
    expect(log.latency).toBeGreaterThanOrEqual(0);
  });

  it('비즈니스 로직 실패 (404 Not Found) 시에도 requestLogs에 기록된다', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/submissions/9999999')
      .expect(404);

    // 비동기로 인한 잠시 대기
    await new Promise((resolve) => setTimeout(resolve, 500));

    const logs = await prisma.requestLogs.findMany({
      where: {
        method: 'GET',
        uri: '/api/v1/submissions/9999999',
      },
    });

    expect(logs.length).toBeGreaterThan(0);
    const log = logs[0];
    expect(log.method).toBe('GET');
    expect(log.uri).toBe('/api/v1/submissions/9999999');
    expect(log.isSuccess).toBe(false);
    expect(log.httpStatus).toBe(404);
    expect(log.latency).toBeGreaterThanOrEqual(0);
  });
});
