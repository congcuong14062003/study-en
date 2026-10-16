/** Imported dictionary glosses are not translations of the example sentence. */
export function exampleSentenceTranslation(
  example: string,
  translation?: string | null,
): string | null {
  const value = translation?.trim();
  if (
    !value ||
    /^Nghĩa trong ngữ cảnh\s*:/iu.test(value) ||
    value.toLocaleLowerCase("vi") === example.trim().toLocaleLowerCase("vi")
  )
    return null;
  return value;
}
