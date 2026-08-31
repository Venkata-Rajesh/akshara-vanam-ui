export type Vowel = 'a' | 'aa' | 'i' | 'ii' | 'u' | 'uu' | 'ru' | 'ruu' | 'e' | 'ee' | 'ai' | 'o' | 'oo' | 'au';

export type Consonant =
  | 'k' | 'kh' | 'g' | 'gh' | 'ng' | 'c' | 'ch' | 'chh' | 'j' | 'jh' | 'ny'
  | 'tt' | 'tth' | 'dd' | 'ddh' | 'nn' | 't' | 'th' | 'd' | 'dh' | 'n'
  | 'p' | 'ph' | 'b' | 'bh' | 'm' | 'y' | 'r' | 'l' | 'v' | 'sh' | 'shh'
  | 's' | 'h' | 'll' | 'rr';

export type Phoneme =
  | { type: 'consonant'; value: Consonant }
  | { type: 'vowel'; value: Vowel }
  | { type: 'anusvara' }
  | { type: 'visarga' }
  | { type: 'virama' };

export interface ParseCandidate { phonemes: Phoneme[]; score: number; consumed: number; }
export interface Akshara { consonants: Consonant[]; vowel: Vowel; }

export type TokenType = 'word' | 'whitespace' | 'punctuation' | 'number' | 'emoji' | 'telugu' | 'english';
export interface Token { text: string; type: TokenType; start: number; end: number; }

export interface DictionaryEntry {
  roman: string;
  telugu: string;
  frequency?: number;
  aliases?: string[];
  tags?: string[];
  pos?: string;
  stem?: string;
}

export interface TransliterationCandidate {
  text: string;
  score: number;
  confidence: number;
  phonemes: Phoneme[];
  source: 'generated' | 'dictionary' | 'user' | 'context';
}

export interface TransliterationOptions { maxCandidates?: number; beamWidth?: number; flexibleRomanization?: boolean; useDictionary?: boolean; }
export interface TransliterationResult { input: string; best: TransliterationCandidate | null; candidates: TransliterationCandidate[]; }
export interface ContextRequest {
  before: string;
  current: string;
  after: string;
  languageMode?: 'telugu' | 'mixed' | 'english';
  style?: 'casual' | 'formal' | 'literary' | 'technical';
}
