export type PoetryLanguage = 'english' | 'telugu';
export type TransliterationMode = 'native' | 'roman';
export type QuoteStatus = 'pending' | 'published' | 'rejected';
export type QuoteReaction = 'like' | 'dislike';

export interface Quote {
  _id: string;
  title?: string;
  author: string;
  content: string;
  tags: string[];
  language?: PoetryLanguage;
  transliterationMode?: TransliterationMode;
  status?: QuoteStatus;
  authorSlug?: string;
  length?: number;
  dateAdded?: string;
  dateModified?: string;
  createdBy?: string;
  likesCount?: number;
  dislikesCount?: number;
  userReaction?: QuoteReaction | null;
}

export interface QuoteComment {
  _id: string;
  quoteId: string;
  userId: string | { _id: string; username: string; avatarUrl?: string };
  body: string;
  language: PoetryLanguage;
  status: 'visible' | 'hidden' | 'deleted';
  createdAt: string;
  updatedAt: string;
}
