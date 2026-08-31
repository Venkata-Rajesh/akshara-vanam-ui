import { Consonant } from '../types';
import { CONSONANTS, VIRAMA } from '../unicode';
export interface Ottu { consonant: Consonant; text: string; }
export const generateOttulu = (): Ottu[] => (Object.keys(CONSONANTS) as Consonant[]).map((consonant) => ({ consonant, text: CONSONANTS[consonant] + VIRAMA }));
