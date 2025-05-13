export function highlightText(
  submitText: string,
  highlights: string[],
): string {
  if (!submitText) return '';
  if (!highlights || highlights.length === 0) return submitText;
  let highlightedText = submitText;

  // TODO: 중복 replace 처리
  for (const highlight of highlights) {
    if (!highlight.trim()) continue;
    const regex = new RegExp(highlight, 'g');
    highlightedText = highlightedText.replace(regex, `<b>${highlight}</b>`);
  }

  return highlightedText;
}
