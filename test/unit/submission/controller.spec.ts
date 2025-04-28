import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ISubmission } from 'src/submission/submission.type';

describe('ISubmission DTO Validation', () => {
  it('모든 필드가 올바르면 검증에 통과한다', async () => {
    const validData = {
      studentId: 1,
      studentName: 'John Doe',
      componentType: 'homework',
      submitText: 'This is my submission',
    };

    const dto = plainToInstance(ISubmission, validData);
    const errors = await validate(dto);

    expect(errors.length).toBe(0);
  });

  it('studentId가 숫자가 아니면 검증 실패한다', async () => {
    const invalidData = {
      studentId: 'not-a-number',
      studentName: 'John Doe',
      componentType: 'homework',
      submitText: 'This is my submission',
    };

    const dto = plainToInstance(ISubmission, invalidData);
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'studentId')).toBe(true);
  });

  it('studentId가 없으면 검증 실패한다', async () => {
    const invalidData = {
      studentName: 'John Doe',
      componentType: 'homework',
      submitText: 'This is my homework',
    };

    const dto = plainToInstance(ISubmission, invalidData);
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'studentId')).toBe(true);
  });

  it('studentName이 비어 있으면 검증 실패한다', async () => {
    const invalidData = {
      studentId: 1,
      studentName: '',
      componentType: 'homework',
      submitText: 'This is my submission',
    };

    const dto = plainToInstance(ISubmission, invalidData);
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'studentName')).toBe(true);
  });

  it('componentType이 빈 문자열이면 검증 실패한다', async () => {
    const invalidData = {
      studentId: 1,
      studentName: 'John Doe',
      componentType: '',
      submitText: 'This is my homework',
    };

    const dto = plainToInstance(ISubmission, invalidData);
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'componentType')).toBe(true);
  });

  it('submitText가 빈 문자열이면 검증 실패한다', async () => {
    const invalidData = {
      studentId: 1,
      studentName: 'John Doe',
      componentType: 'homework',
      submitText: '',
    };

    const dto = plainToInstance(ISubmission, invalidData);
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'submitText')).toBe(true);
  });
});
