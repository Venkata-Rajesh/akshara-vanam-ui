export type PoetryLanguage = 'english' | 'telugu';
export type TransliterationMode = 'native' | 'roman';

export interface Quote {
  _id: string;
  title?: string;
  author: string;
  content: string;
  tags: string[];
  language?: PoetryLanguage;
  transliterationMode?: TransliterationMode;
  authorSlug?: string;
  length?: number;
  dateAdded?: string;
  dateModified?: string;
  createdBy?: string;
  likesCount?: number;
}
