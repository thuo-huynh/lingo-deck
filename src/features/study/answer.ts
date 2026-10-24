export type AnswerOptions = { caseSensitive?: boolean; locale?: string };

// Spec 9.1: trim, NFC, collapse spaces, optional case folding. Never strip diacritics or punctuation.
export function normalizeAnswer(text: string, { caseSensitive = false, locale }: AnswerOptions = {}) {
  const s = text.normalize("NFC").trim().replace(/\s+/g, " ");
  return caseSensitive ? s : s.toLocaleLowerCase(locale);
}

export function checkAnswer(input: string, accepted: string[], opts: AnswerOptions = {}) {
  const given = normalizeAnswer(input, opts);
  const correct = given !== "" && accepted.some((a) => normalizeAnswer(a, opts) === given);
  return { correct, expected: accepted[0] };
}
