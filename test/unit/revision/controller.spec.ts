import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  CreateRevisionDto,
  FindRevisionsQueryDto,
} from 'src/revision/revision.type';

describe('createRevision Request Validation', () => {
  it('정상 케이스: 유효한 submissionId 입력', async () => {
    const dto = plainToInstance(CreateRevisionDto, {
      submissionId: 123,
    });

    const errors = await validate(dto);

    expect(errors.length).toBe(0);
    expect(dto.submissionId).toBe(123);
  });

  it('실패 케이스: submissionId 누락', async () => {
    const dto = plainToInstance(CreateRevisionDto, {});

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('submissionId');
  });

  it('실패 케이스: submissionId가 문자열', async () => {
    const dto = plainToInstance(CreateRevisionDto, {
      submissionId: 'notanumber',
    });

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('submissionId');
  });

  it('실패 케이스: submissionId가 null', async () => {
    const dto = plainToInstance(CreateRevisionDto, {
      submissionId: null,
    });

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('submissionId');
  });

  it('실패 케이스: submissionId가 음수', async () => {
    const dto = plainToInstance(CreateRevisionDto, {
      submissionId: -5,
    });

    const errors = await validate(dto);

    expect(errors.length).toBe(0);
    // ❗ 음수 자체는 IsInt로는 걸리지 않음. Min(1) 같은 추가 검증 없으면 통과함.
  });
});

describe('findAllRevisions Request Validation', () => {
  it('정상 케이스: 기본값 동작', async () => {
    const dto = plainToInstance(FindRevisionsQueryDto, {});
    const errors = await validate(dto);

    expect(errors.length).toBe(0);
    expect(dto.page).toBe(1);
    expect(dto.size).toBe(20);
    expect(dto.sort).toBe('createdAt,DESC');
  });

  it('정상 케이스: page, size, sort 입력', async () => {
    const dto = plainToInstance(FindRevisionsQueryDto, {
      page: 2,
      size: 10,
      sort: 'createdAt,ASC',
    });
    const errors = await validate(dto);

    expect(errors.length).toBe(0);
    expect(dto.page).toBe(2);
    expect(dto.size).toBe(10);
    expect(dto.sort).toBe('createdAt,ASC');
  });

  it('실패 케이스: page 음수', async () => {
    const dto = plainToInstance(FindRevisionsQueryDto, { page: -1 });
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('page');
  });

  it('실패 케이스: size 음수', async () => {
    const dto = plainToInstance(FindRevisionsQueryDto, { size: -5 });
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('size');
  });

  it('실패 케이스: page 문자열 입력', async () => {
    const dto = plainToInstance(FindRevisionsQueryDto, { page: 'abc' });
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('page');
  });

  it('정상 케이스: sort는 자유 입력 (string만 체크)', async () => {
    const dto = plainToInstance(FindRevisionsQueryDto, {
      sort: 'invalidsortformat',
    });
    const errors = await validate(dto);

    expect(errors.length).toBe(0); // 문자열이기만 하면 검증 통과 (format validation은 안 함)
  });
});
