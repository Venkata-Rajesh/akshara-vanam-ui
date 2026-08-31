export interface NormalizedRoman { original: string; normalized: string; compact: string; }

export function normalizeRoman(input: string): NormalizedRoman {
  const normalized = input.normalize('NFKC').toLowerCase().replace(/[’']/g, '');
  return { original: input, normalized, compact: normalized.replace(/\s+/g, '') };
}

/** Generates alternatives without losing the original spelling. */
export function romanAliases(input: string): string[] {
  const value = normalizeRoman(input).compact;
  return [...new Set([value, value.replace(/w/g, 'v'), value.replace(/f/g, 'ph'), value.replace(/c/g, 'ch'), value.replace(/ee/g, 'ii'), value.replace(/oo/g, 'uu')])];
}
