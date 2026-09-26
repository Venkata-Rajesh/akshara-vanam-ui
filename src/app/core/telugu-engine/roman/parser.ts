import { ParseCandidate, Phoneme } from '../types';
import { CONSONANTS, VOWELS } from './inventory';
import { normalizeRoman, romanAliases } from './normalizer';

export interface RomanParserOptions {
  beamWidth?: number;
}
interface State {
  position: number;
  phonemes: Phoneme[];
  score: number;
}

/** Bounded beam parser: ambiguity is retained without exponential work. */
export class RomanPhonemeParser {
  parse(input: string, options: RomanParserOptions = {}): ParseCandidate[] {
    const values = [...new Set([normalizeRoman(input).compact, ...romanAliases(input)])].filter(
      Boolean,
    );
    if (!values.length) return [];
    const parsed = values.flatMap((value, variantIndex) =>
      this.parseValue(value, options.beamWidth ?? 64, variantIndex),
    );
    return parsed
      .sort((a, b) => b.score - a.score)
      .filter(
        (candidate, index, all) =>
          index ===
          all.findIndex(
            (item) => JSON.stringify(item.phonemes) === JSON.stringify(candidate.phonemes),
          ),
      );
  }

  private parseValue(value: string, beamWidth: number, variantIndex: number): ParseCandidate[] {
    let states: State[] = [{ position: 0, phonemes: [], score: 0 }];
    while (states.some((state) => state.position < value.length)) {
      const next: State[] = [];
      for (const state of states) {
        if (state.position >= value.length) {
          next.push(state);
          continue;
        }
        const matches = this.matches(value, state.position);
        if (!matches.length) {
          next.push({
            position: state.position + 1,
            phonemes: state.phonemes,
            score: state.score - 10,
          });
          continue;
        }
        for (const match of matches) {
          // A Roman spelling such as `ee`, `ai`, `ch`, or `ll` is one intended
          // sound unit. Without this preference the parser can incorrectly
          // reward e + e, a + i, c + h, or l + l as separate letters.
          const unitScore = match.weight + (match.length - 1) * 1.15;
          next.push({
            position: state.position + match.length,
            phonemes: [...state.phonemes, match.phoneme],
            score: state.score + unitScore,
          });
        }
      }
      states = next
        .sort((a, b) => b.score / Math.max(1, b.position) - a.score / Math.max(1, a.position))
        .slice(0, beamWidth);
    }
    return states
      .filter((state) => state.position >= value.length)
      .sort((a, b) => b.score - a.score)
      .map((state) => ({
        phonemes: state.phonemes,
        score: state.score - variantIndex * 0.35,
        consumed: state.position,
      }));
  }

  private matches(
    input: string,
    position: number,
  ): Array<{ length: number; weight: number; phoneme: Phoneme }> {
    const matches: Array<{ length: number; weight: number; phoneme: Phoneme }> = [];
    for (const mapping of CONSONANTS)
      if (input.startsWith(mapping.roman, position))
        matches.push({
          length: mapping.roman.length,
          weight: mapping.weight,
          phoneme: { type: 'consonant', value: mapping.value },
        });
    for (const mapping of VOWELS)
      if (input.startsWith(mapping.roman, position))
        matches.push({
          length: mapping.roman.length,
          weight: mapping.weight,
          phoneme: { type: 'vowel', value: mapping.value },
        });
    if (input.startsWith('M', position))
      matches.push({ length: 1, weight: 1.2, phoneme: { type: 'anusvara' } });
    if (input.startsWith('H', position))
      matches.push({ length: 1, weight: 1.2, phoneme: { type: 'visarga' } });
    return matches.sort((a, b) => b.length - a.length);
  }
}
