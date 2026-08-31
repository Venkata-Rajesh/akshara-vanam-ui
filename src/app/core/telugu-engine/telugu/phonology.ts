import { Phoneme } from '../types';
/** Conservative by design: parsing/ranking, not rewriting, resolves ambiguity. */
export const normalizePhonemes = (phonemes: Phoneme[]): Phoneme[] => [...phonemes];
export function phonologyScore(phonemes: Phoneme[]): number {
  let score = 0;
  for (let i = 0; i < phonemes.length - 1; i++) {
    const [current, next] = [phonemes[i], phonemes[i + 1]];
    if (current.type === 'consonant' && next.type === 'vowel') score += 2;
    else if (current.type === 'consonant' && next.type === 'consonant') score += .5;
    else if (current.type === 'vowel' && next.type === 'vowel') score -= .5;
  }
  return score;
}
