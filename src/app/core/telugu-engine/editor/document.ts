import { TeluguTransliterationEngine } from '../engine';

const PROTECTED_SEGMENT = /(```[\s\S]*?```|`[^`]*`|https?:\/\/[^\s]+|\]\([^)]+\)|<[^>]+>)/g;
const isProtectedSegment = (value: string): boolean => /^(?:```[\s\S]*?```|`[^`]*`|https?:\/\/[^\s]+|\]\([^)]+\)|<[^>]+>)$/.test(value);

/** Converts prose only; Markdown code, links, URLs, and HTML remain literal. */
export function transliterateDocument(
  input: string,
  engine: TeluguTransliterationEngine,
  completedOnly = false,
  phrases: ReadonlyMap<string, string> = new Map(),
): string {
  const wordPattern = completedOnly ? /[A-Za-z]+(?=\s|[.,!?;:)\]])/g : /[A-Za-z]+/g;
  return input.split(PROTECTED_SEGMENT).map((part) => {
    if (!part || isProtectedSegment(part)) return part;
    let converted = part;
    for (const [roman, telugu] of [...phrases.entries()].sort(([a], [b]) => b.length - a.length)) {
      const escaped = roman.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const boundary = completedOnly ? '(?=\\s|[.,!?;:)\\]])' : '\\b';
      converted = converted.replace(new RegExp(`\\b${escaped}${boundary}`, 'giu'), telugu);
    }
    return converted.replace(wordPattern, (word) => engine.transliterate(word, { maxCandidates: 1 }).best?.text ?? word);
  }).join('');
}

/** Returns the Roman word directly before a cursor, if the cursor is composing one. */
export function activeRomanWord(input: string, cursor: number): { roman: string; start: number; end: number } | null {
  const before = input.slice(0, cursor);
  const match = before.match(/([A-Za-z]+)$/);
  return match ? { roman: match[1], start: cursor - match[1].length, end: cursor } : null;
}
