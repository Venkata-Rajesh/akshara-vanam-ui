import {
  DictionaryEntry,
  TransliterationCandidate,
  TransliterationOptions,
  TransliterationResult,
} from './types';
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
  {
    roman: 'vachindi',
    telugu: 'వచ్చింది',
    aliases: ['vacchindi', 'vachchindi', 'vachhindi'],
    frequency: 75_000,
  },
  { roman: 'baagunnara', telugu: 'బాగున్నారా', aliases: ['bagunnara'], frequency: 85_000 },

  { roman: 'meeru', telugu: 'మీరు', frequency: 90_000 },
  { roman: 'enti', telugu: 'ఏంటి', aliases: ['yenti'], frequency: 100_000 },
  { roman: 'emiti', telugu: 'ఏమిటి', frequency: 90_000 },
  { roman: 'ki', telugu: 'కి', frequency: 110_000 },
  { roman: 'ku', telugu: 'కు', frequency: 110_000 },
  { roman: 'to', telugu: 'తో', aliases: ['tho'], frequency: 100_000 },
  { roman: 'ni', telugu: 'ని', frequency: 100_000 },
  { roman: 'nu', telugu: 'ను', frequency: 100_000 },
  { roman: 'naku', telugu: 'నాకు', aliases: ['naaku', 'nakuu'], frequency: 90_000 },
  {
    roman: 'vachadu',
    telugu: 'వచ్చాడు',
    aliases: ['vachaadu', 'vacchadu', 'vachhaadu'],
    frequency: 60_000,
  },
  {
    roman: 'chestunnanu',
    telugu: 'చేస్తున్నాను',
    aliases: ['chestunanu', 'chesthunnaanu', 'chesstunnanu'],
    frequency: 60_000,
  },
  { roman: 'telugu', telugu: 'తెలుగు', aliases: ['thelugu', 'telugoo'], frequency: 80_000 },
  {
    roman: 'enduku',
    telugu: 'ఎందుకు',
    aliases: ['endhuku', 'yenduku', 'endukoo'],
    frequency: 70_000,
  },
  { roman: 'nuvvu', telugu: 'నువ్వు', aliases: ['nuvvuu'], frequency: 100_000 },
  { roman: 'manam', telugu: 'మనం', aliases: ['manaM'], frequency: 95_000 },
  { roman: 'memu', telugu: 'మేము', frequency: 80_000 },
  { roman: 'vaallu', telugu: 'వాళ్లు', aliases: ['vallu', 'vaalu'], frequency: 80_000 },
  { roman: 'idi', telugu: 'ఇది', frequency: 110_000 },
  { roman: 'adi', telugu: 'అది', frequency: 110_000 },
  { roman: 'enti', telugu: 'ఏంటి', aliases: ['yenti'], frequency: 100_000 },
  { roman: 'ekkada', telugu: 'ఎక్కడ', aliases: ['ekkadaaa'], frequency: 90_000 },
  { roman: 'ikkada', telugu: 'ఇక్కడ', frequency: 90_000 },
  { roman: 'akkada', telugu: 'అక్కడ', frequency: 90_000 },
  { roman: 'eppudu', telugu: 'ఎప్పుడు', frequency: 85_000 },
  { roman: 'chala', telugu: 'చాలా', aliases: ['chaala', 'chalaa'], frequency: 110_000 },
  { roman: 'bagundi', telugu: 'బాగుంది', aliases: ['baagundi', 'bagundhi'], frequency: 95_000 },
  {
    roman: 'baagunnaru',
    telugu: 'బాగున్నారు',
    aliases: ['bagunnaru', 'baagunnara'],
    frequency: 85_000,
  },
  {
    roman: 'dhanyavadalu',
    telugu: 'ధన్యవాదాలు',
    aliases: ['dhanyavaadaalu', 'thankyou'],
    frequency: 75_000,
  },
  {
    roman: 'namaskaram',
    telugu: 'నమస్కారం',
    aliases: ['namaskaaram', 'namaskaramu'],
    frequency: 100_000,
  },
  { roman: 'prema', telugu: 'ప్రేమ', frequency: 90_000 },
  { roman: 'sneham', telugu: 'స్నేహం', aliases: ['snehamu'], frequency: 75_000 },
  { roman: 'jeevitham', telugu: 'జీవితం', aliases: ['jeevitam'], frequency: 80_000 },
  { roman: 'manasu', telugu: 'మనసు', frequency: 85_000 },
  { roman: 'hrudayam', telugu: 'హృదయం', aliases: ['hridayam'], frequency: 75_000 },
  { roman: 'kavitha', telugu: 'కవిత', aliases: ['kavita'], frequency: 70_000 },
  { roman: 'andamaina', telugu: 'అందమైన', aliases: ['andamaina', 'andamaina'], frequency: 80_000 },
  { roman: 'vennela', telugu: 'వెన్నెల', aliases: ['vennelaa'], frequency: 80_000 },
  { roman: 'prakruthi', telugu: 'ప్రకృతి', aliases: ['prakruti'], frequency: 70_000 },
  { roman: 'amma', telugu: 'అమ్మ', frequency: 110_000 },
  { roman: 'nanna', telugu: 'నాన్న', frequency: 100_000 },
  { roman: 'anna', telugu: 'అన్న', frequency: 95_000 },
  { roman: 'akka', telugu: 'అక్క', frequency: 95_000 },
  { roman: 'hyderabad', telugu: 'హైదరాబాద్', aliases: ['haidarabad'], frequency: 100_000 },
  { roman: 'atanu', telugu: 'అతను', frequency: 75_000 },
  { roman: 'aame', telugu: 'ఆమె', aliases: ['aame', 'ame'], frequency: 75_000 },
  { roman: 'varu', telugu: 'వారు', frequency: 70_000 },
  { roman: 'evaru', telugu: 'ఎవరు', frequency: 80_000 },
  { roman: 'evadu', telugu: 'ఎవడు', frequency: 65_000 },
  { roman: 'vadu', telugu: 'వాడు', frequency: 70_000 },
  { roman: 'thammudu', telugu: 'తమ్ముడు', aliases: ['tammudu'], frequency: 75_000 },
  { roman: 'chelli', telugu: 'చెల్లి', frequency: 70_000 },
  { roman: 'nayana', telugu: 'నాయనా', frequency: 50_000 },
  { roman: 'bava', telugu: 'బావ', frequency: 60_000 },
  { roman: 'mamayya', telugu: 'మామయ్య', frequency: 50_000 },
  { roman: 'sare', telugu: 'సరే', frequency: 80_000 },
  { roman: 'unnaru', telugu: 'ఉన్నారు', frequency: 80_000 },
  { roman: 'unnavu', telugu: 'ఉన్నావు', frequency: 70_000 },
  { roman: 'bagunnava', telugu: 'బాగున్నావా', frequency: 75_000 },
  { roman: 'bagunnanu', telugu: 'బాగున్నాను', frequency: 70_000 },
  { roman: 'please', telugu: 'ప్లీజ్', frequency: 45_000 },
  { roman: 'sorry', telugu: 'సారీ', frequency: 45_000 },
  { roman: 'okay', telugu: 'ఓకే', aliases: ['ok'], frequency: 50_000 },
  { roman: 'ishtam', telugu: 'ఇష్టం', frequency: 75_000 },
  { roman: 'kopam', telugu: 'కోపం', frequency: 60_000 },
  { roman: 'santosham', telugu: 'సంతోషం', frequency: 65_000 },
  { roman: 'badha', telugu: 'బాధ', frequency: 60_000 },
  { roman: 'friend', telugu: 'ఫ్రెండ్', frequency: 50_000 },
  { roman: 'snehithudu', telugu: 'స్నేహితుడు', frequency: 50_000 },
  { roman: 'annam', telugu: 'అన్నం', frequency: 80_000 },
  { roman: 'neellu', telugu: 'నీళ్ళు', frequency: 75_000 },
  { roman: 'paalu', telugu: 'పాలు', frequency: 70_000 },
  { roman: 'coffee', telugu: 'కాఫీ', frequency: 55_000 },
  { roman: 'tea', telugu: 'టీ', frequency: 55_000 },
  { roman: 'illu', telugu: 'ఇల్లు', frequency: 75_000 },
  { roman: 'ooru', telugu: 'ఊరు', frequency: 65_000 },
  { roman: 'pani', telugu: 'పని', frequency: 75_000 },
  { roman: 'pustakam', telugu: 'పుస్తకం', frequency: 55_000 },
  { roman: 'badi', telugu: 'బడి', frequency: 45_000 },
  { roman: 'school', telugu: 'స్కూల్', frequency: 50_000 },
  { roman: 'office', telugu: 'ఆఫీస్', frequency: 50_000 },
  { roman: 'vellali', telugu: 'వెళ్ళాలి', frequency: 65_000 },
  { roman: 'veltunnanu', telugu: 'వెళ్తున్నాను', frequency: 55_000 },
  { roman: 'vachanu', telugu: 'వచ్చాను', frequency: 65_000 },
  { roman: 'vachindi', telugu: 'వచ్చింది', frequency: 65_000 },
  { roman: 'chesanu', telugu: 'చేశాను', frequency: 60_000 },
  { roman: 'thintunnanu', telugu: 'తింటున్నాను', frequency: 50_000 },
  { roman: 'thinnanu', telugu: 'తిన్నాను', frequency: 50_000 },
  { roman: 'chuddam', telugu: 'చూద్దాం', frequency: 55_000 },
  { roman: 'matladu', telugu: 'మాట్లాడు', frequency: 50_000 },
  { roman: 'matladali', telugu: 'మాట్లాడాలి', frequency: 50_000 },
  { roman: 'cheppu', telugu: 'చెప్పు', frequency: 60_000 },
  { roman: 'cheppanu', telugu: 'చెప్పాను', frequency: 50_000 },
  { roman: 'vinu', telugu: 'విను', frequency: 45_000 },
  { roman: 'kalusukundam', telugu: 'కలుసుకుందాం', frequency: 45_000 },
  { roman: 'ivala', telugu: 'ఈవాళ', frequency: 60_000 },
  { roman: 'repu', telugu: 'రేపు', frequency: 65_000 },
  { roman: 'ninna', telugu: 'నిన్న', frequency: 65_000 },
  { roman: 'ippudu', telugu: 'ఇప్పుడు', frequency: 75_000 },
  { roman: 'tarvatha', telugu: 'తర్వాత', frequency: 60_000 },
  { roman: 'roju', telugu: 'రోజు', frequency: 65_000 },
  { roman: 'peru', telugu: 'పేరు', frequency: 70_000 },
  { roman: 'oka', telugu: 'ఒక', frequency: 75_000 },
  { roman: 'okati', telugu: 'ఒకటి', frequency: 70_000 },
  { roman: 'rendu', telugu: 'రెండు', frequency: 70_000 },
  { roman: 'moodu', telugu: 'మూడు', frequency: 65_000 },
  { roman: 'naalugu', telugu: 'నాలుగు', frequency: 55_000 },
  { roman: 'aidu', telugu: 'ఐదు', frequency: 55_000 },
  { roman: 'vijayawada', telugu: 'విజయవాడ', frequency: 55_000 },
  { roman: 'guntur', telugu: 'గుంటూరు', frequency: 55_000 },
  { roman: 'vizag', telugu: 'విశాఖపట్నం', frequency: 55_000 },
  { roman: 'visakhapatnam', telugu: 'విశాఖపట్నం', frequency: 55_000 },
  { roman: 'warangal', telugu: 'వరంగల్', frequency: 50_000 },
  { roman: 'nellore', telugu: 'నెల్లూరు', frequency: 50_000 },
  { roman: 'tirupati', telugu: 'తిరుపతి', frequency: 50_000 },
  { roman: 'telangana', telugu: 'తెలంగాణ', frequency: 60_000 },
  { roman: 'andhra', telugu: 'ఆంధ్ర', frequency: 60_000 },
];

export class TeluguTransliterationEngine {
  private readonly parser = new RomanPhonemeParser();
  private readonly morphology = new RomanTeluguMorphology();
  private readonly dictionary: TeluguDictionary;
  constructor(dictionary: TeluguDictionary = new MemoryTeluguDictionary(CORE_LEXICON)) {
    this.dictionary = dictionary;
  }
  addDictionaryEntry(entry: DictionaryEntry): void {
    this.dictionary.add(entry);
  }

  transliterate(input: string, options: TransliterationOptions = {}): TransliterationResult {
    const maxCandidates = options.maxCandidates ?? 12;
    const candidates: TransliterationCandidate[] = [];
    if (!input.trim()) return { input, best: null, candidates };
    if (options.useDictionary !== false) {
      for (const entry of this.dictionary.lookup(input))
        candidates.push({
          text: entry.telugu,
          score: 150 + Math.log10((entry.frequency ?? 1) + 1) * 10,
          confidence: 1,
          phonemes: [],
          source: entry.tags?.includes('user') ? 'user' : 'dictionary',
        });
      if (input === input.toLowerCase())
        for (const { entry, distance } of fuzzyDictionaryMatches(
          input,
          this.entries(),
          this.fuzzyDistance(input),
        ))
          candidates.push({
            text: entry.telugu,
            score: 95 - distance * 12 + Math.log10((entry.frequency ?? 1) + 1) * 8,
            confidence: 0,
            phonemes: [],
            source: 'dictionary',
          });
    }
    const morphology = this.morphology.analyze(input);
    for (const parse of this.parser.parse(input, { beamWidth: options.beamWidth ?? 64 })) {
      const phonemes = normalizePhonemes(parse.phonemes);
      const text = composePhonemes(phonemes);
      if (!text) continue;
      const ratio = text.length / Math.max(1, input.length);
      const score =
        45 +
        parse.score * 5 +
        phonologyScore(phonemes) +
        morphology.score +
        (ratio > 4 ? -20 : ratio > 3 ? -10 : 10);
      candidates.push({ text, score, confidence: 0, phonemes, source: 'generated' });
    }
    const ranked = rankCandidates(candidates, maxCandidates);
    return { input, best: ranked[0] ?? null, candidates: ranked };
  }
  private entries(): DictionaryEntry[] {
    return this.dictionary.entries?.() ?? [];
  }
  /** Short words are highly ambiguous; don't let fuzzy matching replace them. */
  private fuzzyDistance(input: string): number {
    const length = input.trim().length;
    if (length <= 4) return 0;
    if (length <= 5) return 1;
    return length > 8 ? 3 : 2;
  }
}
