export type SentenceToken = { id: string; value: string };

/** Insert a token before the item at targetIndex, from either the bank or the answer. */
export function insertSentenceToken(
  bank: SentenceToken[],
  answer: SentenceToken[],
  id: string,
  targetIndex: number,
) {
  const answerIndex = answer.findIndex((token) => token.id === id);
  const token = answerIndex >= 0
    ? answer[answerIndex]
    : bank.find((item) => item.id === id);
  if (!token) return { bank, answer };

  const nextBank = answerIndex >= 0
    ? bank
    : bank.filter((item) => item.id !== id);
  const nextAnswer = answer.filter((item) => item.id !== id);
  const requested = Number.isFinite(targetIndex)
    ? Math.trunc(targetIndex)
    : answer.length;
  const adjusted = answerIndex >= 0 && answerIndex < requested
    ? requested - 1
    : requested;
  nextAnswer.splice(Math.max(0, Math.min(nextAnswer.length, adjusted)), 0, token);
  return { bank: nextBank, answer: nextAnswer };
}
