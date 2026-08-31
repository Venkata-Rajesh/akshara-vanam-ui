import { Consonant, Vowel } from '../types';
import { CONSONANTS, VOWEL_SIGNS } from '../unicode';
const VOWELS: Vowel[] = ['a','aa','i','ii','u','uu','ru','ruu','e','ee','ai','o','oo','au'];
export interface Gunintam { consonant: Consonant; vowel: Vowel; text: string; }
export function generateGunintalu(): Gunintam[] { return (Object.keys(CONSONANTS) as Consonant[]).flatMap((consonant) => VOWELS.map((vowel) => ({ consonant, vowel, text: CONSONANTS[consonant] + (vowel === 'a' ? '' : VOWEL_SIGNS[vowel] ?? '') }))); }
