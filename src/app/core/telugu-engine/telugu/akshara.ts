import { Akshara, Consonant, Phoneme, Vowel } from '../types';

export function phonemesToAksharas(phonemes: Phoneme[]): Akshara[] {
  const result: Akshara[] = [];
  let index = 0;
  while (index < phonemes.length) {
    const current = phonemes[index];
    if (current.type === 'vowel') { result.push({ consonants: [], vowel: current.value }); index++; continue; }
    if (current.type !== 'consonant') { index++; continue; }
    const consonants: Consonant[] = [current.value]; index++;
    while (phonemes[index]?.type === 'consonant') { consonants.push((phonemes[index] as { value: Consonant }).value); index++; }
    let vowel: Vowel = 'a';
    if (phonemes[index]?.type === 'vowel') { vowel = (phonemes[index] as { value: Vowel }).value; index++; }
    result.push({ consonants, vowel });
  }
  return result;
}
