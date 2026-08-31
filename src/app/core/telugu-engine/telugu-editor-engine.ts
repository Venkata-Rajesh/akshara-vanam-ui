import { TeluguContextEngine } from './context/context-engine';
import { transliterateDocument } from './editor/document';
import { TeluguTransliterationEngine } from './engine';
import { ContextRequest, TransliterationCandidate, TransliterationResult } from './types';
export class TeluguEditorEngine {
  private readonly transliterator: TeluguTransliterationEngine;
  private readonly context: TeluguContextEngine;
  private readonly phrases = new Map<string, string>([
    ['ela unnaru', 'ఎలా ఉన్నారు'],
    ['ela unnavu', 'ఎలా ఉన్నావు'],
    ['baagunnara', 'బాగున్నారా'],
  ]);
  constructor(transliterator = new TeluguTransliterationEngine()) { this.transliterator = transliterator; this.context = new TeluguContextEngine(transliterator); }
  transliterateWord(input: string): TransliterationResult { return this.transliterator.transliterate(input); }
  suggest(request: ContextRequest): TransliterationCandidate[] { return this.context.transliterateContext(request); }
  transliterateText(input: string, completedOnly = false): string { return transliterateDocument(input, this.transliterator, completedOnly, this.phrases); }
  remember(roman: string, telugu: string): void { this.transliterator.addDictionaryEntry({ roman, telugu, frequency: 1_000_000, tags: ['user'] }); }
  rememberPhrase(roman: string, telugu: string): void { this.phrases.set(roman.trim().toLowerCase(), telugu); }
}
