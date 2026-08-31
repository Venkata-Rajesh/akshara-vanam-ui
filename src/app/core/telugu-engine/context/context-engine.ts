import { ContextRequest, TransliterationCandidate } from '../types';
import { TeluguTransliterationEngine } from '../engine';
import { tokenize } from './tokenizer';
export class TeluguContextEngine {
  constructor(private readonly engine: TeluguTransliterationEngine) {}
  transliterateContext(request: ContextRequest): TransliterationCandidate[] {
    const current = request.current.trim();
    if (!current) return [];
    const neighbours = [...tokenize(request.before), ...tokenize(request.after)].filter((token) => token.type === 'word' || token.type === 'telugu').length;
    return this.engine.transliterate(current, { maxCandidates: 16, beamWidth: 64, flexibleRomanization: true, useDictionary: true }).candidates
      .map((candidate) => ({ ...candidate, score: candidate.score + Math.min(neighbours, 2), source: 'context' as const }))
      .sort((a, b) => b.score - a.score);
  }
}
