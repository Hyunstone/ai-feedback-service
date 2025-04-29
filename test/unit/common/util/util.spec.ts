import { highlightText } from 'src/common/util/string.util'; // 네 경로에 맞게 수정

describe('highlightText', () => {
  it('단일 단어를 하이라이트 처리한다', () => {
    const submitText = 'I like pizza and school.';
    const highlights = ['pizza'];
    const result = highlightText(submitText, highlights);
    expect(result).toBe('I like <b>pizza</b> and school.');
  });

  it('여러 단어를 하이라이트 처리한다', () => {
    const submitText = 'I like pizza and school.';
    const highlights = ['pizza', 'school'];
    const result = highlightText(submitText, highlights);
    expect(result).toBe('I like <b>pizza</b> and <b>school</b>.');
  });

  it('submitText가 빈 문자열이면 빈 문자열을 반환한다', () => {
    const result = highlightText('', ['pizza']);
    expect(result).toBe('');
  });

  it('highlight가 비어있으면 원본 submitText를 반환한다', () => {
    const submitText = 'I like pizza and school.';
    const result = highlightText(submitText, []);
    expect(result).toBe('I like pizza and school.');
  });

  it('highlight에 빈 문자열이 있으면 무시하고 처리한다', () => {
    const submitText = 'I like pizza and school.';
    const highlights = ['', 'pizza'];
    const result = highlightText(submitText, highlights);
    expect(result).toBe('I like <b>pizza</b> and school.');
  });

  it('highlight가 여러 번 등장하면 모두 감싼다', () => {
    const submitText = 'pizza pizza pizza';
    const highlights = ['pizza'];
    const result = highlightText(submitText, highlights);
    expect(result).toBe('<b>pizza</b> <b>pizza</b> <b>pizza</b>');
  });

  it('highlight가 submitText에 없으면 변화가 없다', () => {
    const submitText = 'I like pizza and school.';
    const highlights = ['burger'];
    const result = highlightText(submitText, highlights);
    expect(result).toBe('I like pizza and school.');
  });
});
