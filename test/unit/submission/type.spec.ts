import 'reflect-metadata';
import {
  toLogIdProperties,
  toAiFeedBackType,
  OFeedBackResultType,
} from 'src/submission/submission.type';

describe('submission.type 유틸 함수', () => {
  describe('toLogIdProperties', () => {
    it('정상적으로 LogIdProperites 객체를 생성한다', () => {
      const traceId = 'sample-trace-id';
      const studentId = 123;
      const submissionId = 456;
      const startTime = 7890;

      const result = toLogIdProperties(
        traceId,
        studentId,
        submissionId,
        startTime,
      );

      expect(result).toEqual({
        traceId,
        studentId,
        submissionId,
        startTime,
      });
    });
  });

  describe('toAiFeedBackType', () => {
    it('올바른 포맷의 문자열을 파싱해 OFeedBackResultType을 반환한다', () => {
      const chat = `Score: 85
  Feedback: Good job overall.
  Highlight 1
  Highlight 2`;

      const result = toAiFeedBackType(chat);

      expect(result).toEqual<OFeedBackResultType>({
        score: 85,
        feedback: 'Good job overall.',
        highlights: ['Highlight 1', 'Highlight 2'],
      });
    });

    it('잘못된 포맷이면 에러를 던진다', () => {
      const invalidChat = `Invalid format without score and feedback`;

      expect(() => toAiFeedBackType(invalidChat)).toThrowError(
        'Invalid AI feedback format',
      );
    });

    it('score가 number가 아니면 에러를 던진다', () => {
      const chat = `Score: not-a-number
  Feedback: Good feedback.
  Highlight 1`;
      expect(() => {
        toAiFeedBackType(chat);
      }).toThrow('Invalid AI feedback format');
    });

    it('highlight가 string array가 아니면 에러를 던진다', () => {
      const chat = `Score: 90
  Feedback: Nice work.
  `;

      const result = toAiFeedBackType(chat);
      expect(result.highlights).toEqual(['']);
    });
  });
});
