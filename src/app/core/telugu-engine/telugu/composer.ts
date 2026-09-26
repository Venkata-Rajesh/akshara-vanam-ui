import { Akshara, Phoneme } from '../types';
import {
  ANUSVARA,
  CONSONANTS,
  INDEPENDENT_VOWELS,
  normalizeTelugu,
  VIRAMA,
  VISARGA,
  VOWEL_SIGNS,
} from '../unicode';
import { phonemesToAksharas } from './akshara';

export function composeAkshara(akshara: Akshara): string {
  let output = '';
  if (!akshara.consonants.length) {
    output = akshara.vowel ? (INDEPENDENT_VOWELS[akshara.vowel] ?? '') : '';
  } else {
    for (let index = 0; index < akshara.consonants.length; index++) {
      output += CONSONANTS[akshara.consonants[index]];
      if (index < akshara.consonants.length - 1) output += VIRAMA;
    }
    if (!akshara.vowel) {
      output += VIRAMA;
    } else if (akshara.vowel !== 'a') {
      output += VOWEL_SIGNS[akshara.vowel] ?? '';
    }
  }

  if (akshara.modifier === 'anusvara') output += ANUSVARA;
  else if (akshara.modifier === 'visarga') output += VISARGA;
  else if (akshara.modifier === 'virama') output += VIRAMA;

  return output;
}

export function composePhonemes(phonemes: Phoneme[]): string {
  let output = phonemesToAksharas(phonemes).map(composeAkshara).join('');

  // Post-processing: Contextual Anusvara (Sunna / ం) Optimization
  // Rule A: 'm' at the end of a word (no following characters in this phoneme sequence) becomes 'ం'
  output = output.replace(/మ్$/g, 'ం');

  // Rule B: 'n' or 'm' preceding specific consonants naturally becomes 'ం'
  const sunnaTargetConsonants = '[కఖగఘచఛజఝటఠడఢతథదధపఫబభసశషహ]';
  const sunnaRegex = new RegExp(`(?:మ్|న్)(?=${sunnaTargetConsonants})`, 'g');
  output = output.replace(sunnaRegex, 'ం');

  return normalizeTelugu(output);
}
