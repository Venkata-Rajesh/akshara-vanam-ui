import { DictionaryEntry, TransliterationCandidate, TransliterationOptions, TransliterationResult } from './types';
import { fuzzyDictionaryMatches } from './dictionary/fuzzy';
import { MemoryTeluguDictionary, TeluguDictionary } from './dictionary/dictionary';
import { RomanTeluguMorphology } from './morphology/roman-morphology';
import { RomanPhonemeParser } from './roman/parser';
import { rankCandidates } from './ranking/ranker';
import { composePhonemes } from './telugu/composer';
import { normalizePhonemes, phonologyScore } from './telugu/phonology';

const CORE_LEXICON: DictionaryEntry[] = [
  { roman: 'nenu', telugu: 'నేను', frequency: 100_000 },
  { roman: 'ninnu', telugu: 'నిన్ను', frequency: 95_000 },
  { roman: 'ela', telugu: 'ఎలా', aliases: ['elā', 'elAA'], frequency: 100_000 },
  { roman: 'nee', telugu: 'నీ', aliases: ['nii'], frequency: 100_000 },
  { roman: 'pai', telugu: 'పై', frequency: 90_000 },
  { roman: 'korika', telugu: 'కోరిక', aliases: ['koorika'], frequency: 75_000 },
  { roman: 'vachindi', telugu: 'వచ్చింది', aliases: ['vacchindi', 'vachchindi', 'vachhindi'], frequency: 75_000 },
  { roman: 'meeru', telugu: 'మీరు', frequency: 90_000 },
  { roman: 'lo', telugu: 'లో', aliases: ['loo'], frequency: 120_000 },
  { roman: 'ki', telugu: 'కి', frequency: 110_000 },
  { roman: 'ku', telugu: 'కు', frequency: 110_000 },
  { roman: 'to', telugu: 'తో', aliases: ['tho'], frequency: 100_000 },
  { roman: 'ni', telugu: 'ని', frequency: 100_000 },
  { roman: 'nu', telugu: 'ను', frequency: 100_000 },
  { roman: 'naku', telugu: 'నాకు', aliases: ['naaku', 'nakuu'], frequency: 90_000 },
  { roman: 'vachadu', telugu: 'వచ్చాడు', aliases: ['vachaadu', 'vacchadu', 'vachhaadu'], frequency: 60_000 },
  { roman: 'chestunnanu', telugu: 'చేస్తున్నాను', aliases: ['chestunanu', 'chesthunnaanu', 'chesstunnanu'], frequency: 60_000 },
  { roman: 'telugu', telugu: 'తెలుగు', aliases: ['thelugu', 'telugoo'], frequency: 80_000 },
  { roman: 'enduku', telugu: 'ఎందుకు', aliases: ['endhuku', 'yenduku', 'endukoo'], frequency: 70_000 },
];

export class TeluguTransliterationEngine {
  private readonly parser = new RomanPhonemeParser();
  private readonly morphology = new RomanTeluguMorphology();
  private readonly dictionary: TeluguDictionary;
  constructor(dictionary: TeluguDictionary = new MemoryTeluguDictionary(CORE_LEXICON)) { this.dictionary = dictionary; }
  addDictionaryEntry(entry: DictionaryEntry): void { this.dictionary.add(entry); }

  transliterate(input: string, options: TransliterationOptions = {}): TransliterationResult {
    const maxCandidates = options.maxCandidates ?? 12;
    const candidates: TransliterationCandidate[] = [];
    if (!input.trim()) return { input, best: null, candidates };
    if (options.useDictionary !== false) {
      for (const entry of this.dictionary.lookup(input)) candidates.push({ text: entry.telugu, score: 150 + Math.log10((entry.frequency ?? 1) + 1) * 10, confidence: 1, phonemes: [], source: entry.tags?.includes('user') ? 'user' : 'dictionary' });
      for (const { entry, distance } of fuzzyDictionaryMatches(input, this.entries(), this.fuzzyDistance(input))) candidates.push({ text: entry.telugu, score: 95 - distance * 12 + Math.log10((entry.frequency ?? 1) + 1) * 8, confidence: 0, phonemes: [], source: 'dictionary' });
    }
    const morphology = this.morphology.analyze(input);
    for (const parse of this.parser.parse(input, { beamWidth: options.beamWidth ?? 64 })) {
      const phonemes = normalizePhonemes(parse.phonemes);
      const text = composePhonemes(phonemes);
      if (!text) continue;
      const ratio = text.length / Math.max(1, input.length);
      const score = 45 + parse.score * 5 + phonologyScore(phonemes) + morphology.score + (ratio > 4 ? -20 : ratio > 3 ? -10 : 10);
      candidates.push({ text, score, confidence: 0, phonemes, source: 'generated' });
    }
    const ranked = rankCandidates(candidates, maxCandidates);
    return { input, best: ranked[0] ?? null, candidates: ranked };
  }
  private entries(): DictionaryEntry[] { return this.dictionary.entries?.() ?? []; }
  /** Short words are highly ambiguous; don't let fuzzy matching replace them. */
  private fuzzyDistance(input: string): number {
    const length = input.trim().length;
    if (length <= 4) return 0;
    if (length <= 5) return 1;
    return length > 8 ? 3 : 2;
  }
}
