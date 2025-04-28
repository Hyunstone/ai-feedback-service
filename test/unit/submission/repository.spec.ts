import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { SubmissionRepository } from 'src/submission/submission.repository';
import { v4 as uuidv4 } from 'uuid';

describe('SubmissionRepository (Integration Test)', () => {
  let repository: SubmissionRepository;
  let prisma: PrismaService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SubmissionRepository, PrismaService],
    }).compile();

    repository = module.get<SubmissionRepository>(SubmissionRepository);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(async () => {
    await prisma.analysisHighlights.deleteMany();
    await prisma.submissionsAnalysis.deleteMany();
    await prisma.submissionLogs.deleteMany();
    await prisma.submissionMedia.deleteMany();
    await prisma.submissions.deleteMany();
    await prisma.submissionComponentType.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('componentType을 조회하고 결과를 반환한다', async () => {
    await prisma.submissionComponentType.create({
      data: { name: 'essay' },
    });

    const result = await repository.getComponentType('essay');

    expect(result).not.toBeNull();
    expect(result?.name).toBe('essay');
  });

  it('studentId와 componentType으로 submission을 조회하고 결과를 반환한다', async () => {
    await prisma.submissionComponentType.create({ data: { name: 'essay' } });

    const student = await prisma.students.create({
      data: {
        name: 'student1',
      },
    });

    const submission = await prisma.submissions.create({
      data: {
        studentId: Number(student.id),
        componentType: 'essay',
        status: 'processing',
        submitText: 'test text',
      },
    });

    const result = await repository.getSubmissionByStudentIdAndComponentType(
      Number(student.id),
      'essay',
    );

    expect(result).not.toBeNull();
    expect(result.id).toBe(submission.id);
    expect(result.studentId).toBe(student.id);
    expect(result.componentType).toBe('essay');
  });

  it('media를 저장하고 DB에 반영되는지 검증한다', async () => {
    await prisma.submissionComponentType.create({ data: { name: 'homework' } });
    const student = await prisma.students.create({
      data: {
        name: 'student1',
      },
    });

    const submission = await prisma.submissions.create({
      data: {
        studentId: Number(student.id),
        componentType: 'homework',
        status: 'processing',
        submitText: 'some text',
      },
    });

    await repository.saveMedia(
      Number(submission.id),
      'video',
      'http://example.com',
    );

    // const submissionMedia = await prisma.submissionMedia.findFirst({
    //   where: { submissionId: submission.id },
    // });

    const submissionMedia = await prisma.submissionMedia.findFirst({
      where: { submissionId: Number(submission.id) },
    });

    expect(submissionMedia).not.toBeNull();
    expect(submissionMedia.type).toBe('video');
    expect(submissionMedia.url).toBe('http://example.com');
  });

  it('submission을 저장하고 DB에 반영되는지 검증한다', async () => {
    await prisma.submissionComponentType.create({ data: { name: 'quiz' } });
    const student = await prisma.students.create({
      data: {
        name: 'student1',
      },
    });

    const submission = await repository.saveSubmission({
      studentId: Number(student.id),
      componentType: 'quiz',
      submitText: 'quiz text',
    });

    const dbSubmission = await prisma.submissions.findUnique({
      where: { id: submission.id },
    });

    expect(dbSubmission).not.toBeNull();
    expect(dbSubmission.studentId).toBe(student.id);
    expect(dbSubmission.componentType).toBe('quiz');
    expect(dbSubmission.status).toBe('processing');
  });

  it('analysis 결과를 트랜잭션으로 저장하고 정상적으로 연결되는지 검증한다', async () => {
    await prisma.submissionComponentType.create({ data: { name: 'project' } });
    const student = await prisma.students.create({
      data: {
        name: 'student1',
      },
    });

    const submission = await prisma.submissions.create({
      data: {
        studentId: student.id,
        componentType: 'project',
        status: 'processing',
        submitText: 'project text',
      },
    });

    await repository.saveAnalysisResult({
      submissionId: Number(submission.id),
      score: 85,
      feedback: 'Great job',
      highlightResult: 'highlighted text',
      highlights: ['highlight1', 'highlight2'],
    });

    const analysis = await prisma.submissionsAnalysis.findFirst({
      where: { submissionId: Number(submission.id) },
    });
    const highlights = await prisma.analysisHighlights.findMany({
      where: { submissionAnalysisId: Number(analysis.id) },
    });
    const updatedSubmission = await prisma.submissions.findUnique({
      where: { id: submission.id },
    });

    expect(analysis).not.toBeNull();
    expect(analysis?.score).toBe(85);
    expect(highlights.length).toBe(2);
    expect(updatedSubmission?.status).toBe('completed');
  });

  it('submission log를 생성하고 DB에 반영되는지 검증한다', async () => {
    await prisma.submissionComponentType.create({ data: { name: 'test' } });
    const student = await prisma.students.create({
      data: {
        name: 'student1',
      },
    });

    const submission = await prisma.submissions.create({
      data: {
        studentId: student.id,
        componentType: 'test',
        status: 'processing',
        submitText: 'test text',
      },
    });

    const log = await repository.createSubmissionLog({
      traceId: uuidv4(),
      studentId: 5,
      submissionId: Number(submission.id),
      latency: 200,
      isSuccess: true,
      action: 'submit',
      errorMessage: undefined,
    });

    const dbLog = await prisma.submissionLogs.findUnique({
      where: { id: log.id },
    });

    expect(dbLog).not.toBeNull();
    expect(dbLog.traceId).toBe(log.traceId);
    expect(dbLog.latency).toBe(200);
    expect(dbLog.isSuccess).toBe(true);
    expect(dbLog.action).toBe('submit');
  });
});
