describe('highlightText', () => {
  let instance: any;

  beforeEach(() => {
    instance = new (class {
      highlightText(submitText: string, highlights: string[]): string {
        if (!submitText) return '';
        if (!highlights || highlights.length === 0) return submitText;
        let highlightedText = submitText;
        const sortedHighlights = highlights.sort((a, b) => b.length - a.length);
        for (const highlight of sortedHighlights) {
          if (!highlight.trim()) continue;
          const regex = new RegExp(highlight, 'g');
          highlightedText = highlightedText.replace(
            regex,
            `<b>${highlight}</b>`,
          );
        }
        return highlightedText;
      }
    })();
  });

  it('단일 단어를 하이라이트 처리한다', () => {
    const submitText = 'I like pizza and school.';
    const highlights = ['pizza'];
    const result = instance.highlightText(submitText, highlights);
    expect(result).toBe('I like <b>pizza</b> and school.');
  });

  it('여러 단어를 하이라이트 처리한다', () => {
    const submitText = 'I like pizza and school.';
    const highlights = ['pizza', 'school'];
    const result = instance.highlightText(submitText, highlights);
    expect(result).toBe('I like <b>pizza</b> and <b>school</b>.');
  });

  it('submitText가 빈 문자열이면 빈 문자열을 반환한다', () => {
    const result = instance.highlightText('', ['pizza']);
    expect(result).toBe('');
  });

  it('highlight가 비어있으면 원본 submitText를 반환한다', () => {
    const submitText = 'I like pizza and school.';
    const result = instance.highlightText(submitText, []);
    expect(result).toBe('I like pizza and school.');
  });

  it('highlight에 빈 문자열이 있으면 무시하고 처리한다', () => {
    const submitText = 'I like pizza and school.';
    const highlights = ['', 'pizza'];
    const result = instance.highlightText(submitText, highlights);
    expect(result).toBe('I like <b>pizza</b> and school.');
  });
});
