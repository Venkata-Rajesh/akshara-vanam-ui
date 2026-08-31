import { Akshara, Phoneme } from '../types';
import { ANUSVARA, CONSONANTS, INDEPENDENT_VOWELS, normalizeTelugu, VIRAMA, VISARGA, VOWEL_SIGNS } from '../unicode';
import { phonemesToAksharas } from './akshara';

export function composeAkshara(akshara: Akshara): string {
  if (!akshara.consonants.length) return INDEPENDENT_VOWELS[akshara.vowel] ?? '';
  let output = '';
  for (let index = 0; index < akshara.consonants.length; index++) {
    output += CONSONANTS[akshara.consonants[index]];
    if (index < akshara.consonants.length - 1) output += VIRAMA;
  }
  return akshara.vowel === 'a' ? output : output + (VOWEL_SIGNS[akshara.vowel] ?? '');
}

export function composePhonemes(phonemes: Phoneme[]): string {
  let suffix = '';
  const normal = phonemes.filter((phoneme) => {
    if (phoneme.type === 'anusvara') { suffix += ANUSVARA; return false; }
    if (phoneme.type === 'visarga') { suffix += VISARGA; return false; }
    if (phoneme.type === 'virama') { suffix += VIRAMA; return false; }
    return true;
  });
  return normalizeTelugu(phonemesToAksharas(normal).map(composeAkshara).join('') + suffix);
}
