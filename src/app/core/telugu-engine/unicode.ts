import { Consonant, Vowel } from './types';

export const INDEPENDENT_VOWELS: Record<Vowel, string> = { a: 'అ', aa: 'ఆ', i: 'ఇ', ii: 'ఈ', u: 'ఉ', uu: 'ఊ', ru: 'ఋ', ruu: 'ౠ', e: 'ఎ', ee: 'ఏ', ai: 'ఐ', o: 'ఒ', oo: 'ఓ', au: 'ఔ' };
export const CONSONANTS: Record<Consonant, string> = {
  k: 'క', kh: 'ఖ', g: 'గ', gh: 'ఘ', ng: 'ఙ', c: 'చ', ch: 'చ', chh: 'ఛ', j: 'జ', jh: 'ఝ', ny: 'ఞ',
  tt: 'ట', tth: 'ఠ', dd: 'డ', ddh: 'ఢ', nn: 'ణ', t: 'త', th: 'థ', d: 'ద', dh: 'ధ', n: 'న',
  p: 'ప', ph: 'ఫ', b: 'బ', bh: 'భ', m: 'మ', y: 'య', r: 'ర', l: 'ల', v: 'వ', sh: 'శ', shh: 'ష', s: 'స', h: 'హ', ll: 'ళ', rr: 'ఱ',
};
export const VOWEL_SIGNS: Partial<Record<Vowel, string>> = { aa: 'ా', i: 'ి', ii: 'ీ', u: 'ు', uu: 'ూ', ru: 'ృ', ruu: 'ౄ', e: 'ె', ee: 'ే', ai: 'ై', o: 'ొ', oo: 'ో', au: 'ౌ' };
export const VIRAMA = '్';
export const ANUSVARA = 'ం';
export const VISARGA = 'ః';
export const CHANDRABINDU = 'ఁ';
export const isTeluguCharacter = (char: string): boolean => { const cp = char.codePointAt(0); return cp !== undefined && cp >= 0x0c00 && cp <= 0x0c7f; };
export const normalizeTelugu = (text: string): string => text.normalize('NFC');
