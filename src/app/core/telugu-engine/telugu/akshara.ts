import { Akshara, Consonant, Phoneme, Vowel } from '../types';

export function phonemesToAksharas(phonemes: Phoneme[]): Akshara[] {
  const result: Akshara[] = [];
  let index = 0;
  while (index < phonemes.length) {
    const current = phonemes[index];
    if (current.type === 'vowel') {
      const akshara: Akshara = { consonants: [], vowel: current.value };
      index++;
      if (
        index < phonemes.length &&
        (phonemes[index].type === 'anusvara' ||
          phonemes[index].type === 'visarga' ||
          phonemes[index].type === 'virama')
      ) {
        akshara.modifier = phonemes[index].type as any;
        index++;
      }
      result.push(akshara);
      continue;
    }
    if (current.type === 'anusvara' || current.type === 'visarga' || current.type === 'virama') {
      result.push({ consonants: [], vowel: null, modifier: current.type });
      index++;
      continue;
    }
    if (current.type !== 'consonant') {
      index++;
      continue;
    }
    const consonants: Consonant[] = [current.value];
    index++;
    while (phonemes[index]?.type === 'consonant') {
      consonants.push((phonemes[index] as { value: Consonant }).value);
      index++;
    }
    let vowel: Vowel | null = null;
    if (phonemes[index]?.type === 'vowel') {
      vowel = (phonemes[index] as { value: Vowel }).value;
      index++;
    }

    let modifier: 'anusvara' | 'visarga' | 'virama' | undefined;
    if (
      index < phonemes.length &&
      (phonemes[index].type === 'anusvara' ||
        phonemes[index].type === 'visarga' ||
        phonemes[index].type === 'virama')
    ) {
      modifier = phonemes[index].type as any;
      index++;
    }

    result.push({ consonants, vowel, modifier });
  }
  return result;
}
