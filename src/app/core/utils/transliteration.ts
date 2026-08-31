import { TeluguEditorEngine } from '../telugu-engine';

export type TransliterationMode = 'informal' | 'itrans' | 'iso';
export type PoetryLanguage = 'english' | 'telugu';

const engine = new TeluguEditorEngine();

/** Converts Latin words while preserving Markdown syntax, URLs, and HTML. */
export function convertRomanToTelugu(input: string): string {
  if (!input) return '';
  return engine.transliterateText(input);
}

/**
 * Keystroke-safe conversion for the editor: leave the word under composition
 * in Roman script, and commit only words that have reached a boundary.
 */
export function convertCompletedRomanWords(input: string): string {
  if (!input) return '';
  return engine.transliterateText(input, true);
}

export function getPoetryLanguageLabel(language: PoetryLanguage): string { return language === 'telugu' ? 'Telugu' : 'English'; }
