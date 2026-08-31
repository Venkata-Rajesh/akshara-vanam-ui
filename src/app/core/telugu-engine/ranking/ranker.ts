import { TransliterationCandidate } from '../types';
export function rankCandidates(candidates: TransliterationCandidate[], maxCandidates: number): TransliterationCandidate[] {
  const unique = new Map<string, TransliterationCandidate>();
  for (const candidate of candidates) if (!unique.get(candidate.text) || candidate.score > unique.get(candidate.text)!.score) unique.set(candidate.text, candidate);
  return [...unique.values()].sort((a, b) => b.score - a.score).slice(0, maxCandidates).map((candidate, index) => ({ ...candidate, confidence: Math.max(.01, Math.min(.999, 1 - index * .08)) }));
}
