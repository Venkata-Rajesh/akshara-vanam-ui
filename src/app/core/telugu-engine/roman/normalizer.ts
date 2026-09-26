export interface NormalizedRoman {
  original: string;
  normalized: string;
  compact: string;
}

export function normalizeRoman(input: string): NormalizedRoman {
  const normalized = input.normalize('NFKC').replace(/[’']/g, '');
  return { original: input, normalized, compact: normalized.replace(/\s+/g, '') };
}

/** Keeps RTS capitalization meaningful while exposing the common chat spelling. */
export function romanLookupKeys(input: string): string[] {
  const { compact } = normalizeRoman(input);
  return [...new Set([compact, compact.toLowerCase()])];
}

/** Generates alternatives without losing the original spelling. */
export function romanAliases(input: string): string[] {
  const value = normalizeRoman(input).compact;
  const lower = value.toLowerCase();
  return [
    ...new Set([
      value,
      lower,
      lower.replace(/w/g, 'v'),
      lower.replace(/f/g, 'ph'),
      lower.replace(/c/g, 'ch'),
      lower.replace(/ee/g, 'ii'),
      lower.replace(/oo/g, 'uu'),
      lower.replace(/ee/g, 'e'),
      lower.replace(/oo/g, 'o'),
      lower.replace(/ou/g, 'au'),
      lower.replace(/ei/g, 'ai'),
      lower.replace(/c/g, 'ch'),
      lower.replace(/q/g, 'k'),
      lower.replace(/x/g, 'ks'),
    ]),
  ];
}
