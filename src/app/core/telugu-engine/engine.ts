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

  { roman: 'thanks', telugu: 'థాంక్స్', frequency: 45_000 },
  { roman: 'anni', telugu: 'అన్నీ', frequency: 75_000 },
  { roman: 'kani', telugu: 'కాని', frequency: 60_000 },
  { roman: 'kaani', telugu: 'కానీ', frequency: 60_000 },
  { roman: 'kuda', telugu: 'కూడా', aliases: ['kooda'], frequency: 75_000 },
  { roman: 'vundi', telugu: 'ఉంది', frequency: 60_000 },
  { roman: 'avunu', telugu: 'అవును', frequency: 75_000 },
  { roman: 'kadu', telugu: 'కాదు', frequency: 65_000 },
  { roman: 'premisthunnanu', telugu: 'ప్రేమిస్తున్నాను', frequency: 55_000 },
  { roman: 'ishtapadutunnanu', telugu: 'ఇష్టపడుతున్నాను', frequency: 50_000 },
  { roman: 'ee', telugu: 'ఈ', frequency: 70_000 },
  { roman: 'naa', telugu: 'నా', frequency: 75_000 },
  { roman: 'naadi', telugu: 'నాది', frequency: 60_000 },
  { roman: 'vaadiki', telugu: 'వాడికి', frequency: 55_000 },
  { roman: 'neeku', telugu: 'నీకు', frequency: 70_000 },
  { roman: 'mana', telugu: 'మన', frequency: 65_000 },
  { roman: 'andaru', telugu: 'అందరూ', frequency: 70_000 },
  { roman: 'andariki', telugu: 'అందరికీ', frequency: 65_000 },

  { roman: 'kurnool', telugu: 'కర్నూలు', frequency: 50_000 },
  { roman: 'kadapa', telugu: 'కడప', frequency: 50_000 },
  { roman: 'rajahmundry', telugu: 'రాజమండ్రి', frequency: 50_000 },
  { roman: 'karimnagar', telugu: 'కరీంనగర్', frequency: 50_000 },
  { roman: 'khammam', telugu: 'ఖమ్మం', frequency: 50_000 },
  { roman: 'nizamabad', telugu: 'నిజామాబాద్', frequency: 50_000 },
  { roman: 'anantapur', telugu: 'అనంతపురం', frequency: 50_000 },
  { roman: 'ongole', telugu: 'ఒంగోలు', frequency: 50_000 },
  { roman: 'eluru', telugu: 'ఏలూరు', frequency: 50_000 },
  { roman: 'machilipatnam', telugu: 'మచిలీపట్నం', frequency: 50_000 },
  { roman: 'secunderabad', telugu: 'సికింద్రాబాద్', frequency: 50_000 },

  { roman: 'rama', telugu: 'రామ', frequency: 50_000 },
  { roman: 'ramudu', telugu: 'రాముడు', frequency: 45_000 },
  { roman: 'sita', telugu: 'సీత', aliases: ['seetha'], frequency: 50_000 },
  { roman: 'geetha', telugu: 'గీత', frequency: 45_000 },
  { roman: 'radha', telugu: 'రాధ', frequency: 45_000 },
  { roman: 'krishna', telugu: 'కృష్ణ', frequency: 55_000 },
  { roman: 'lakshmi', telugu: 'లక్ష్మి', frequency: 55_000 },
  { roman: 'saraswati', telugu: 'సరస్వతి', frequency: 45_000 },
  { roman: 'ganesh', telugu: 'గణేష్', frequency: 50_000 },
  { roman: 'shiva', telugu: 'శివ', frequency: 50_000 },
  { roman: 'vishnu', telugu: 'విష్ణు', frequency: 50_000 },
  { roman: 'hanuman', telugu: 'హనుమాన్', frequency: 45_000 },
  { roman: 'durga', telugu: 'దుర్గ', frequency: 45_000 },
  { roman: 'ravi', telugu: 'రవి', frequency: 50_000 },
  { roman: 'suresh', telugu: 'సురేష్', frequency: 50_000 },
  { roman: 'ramesh', telugu: 'రమేష్', frequency: 50_000 },
  { roman: 'mahesh', telugu: 'మహేష్', frequency: 50_000 },
  { roman: 'naresh', telugu: 'నరేష్', frequency: 45_000 },
  { roman: 'rajesh', telugu: 'రాజేష్', frequency: 50_000 },
  { roman: 'srinivas', telugu: 'శ్రీనివాస్', frequency: 50_000 },
  { roman: 'venkatesh', telugu: 'వెంకటేష్', frequency: 50_000 },
  { roman: 'prasad', telugu: 'ప్రసాద్', frequency: 50_000 },
  { roman: 'kiran', telugu: 'కిరణ్', frequency: 50_000 },
  { roman: 'pavan', telugu: 'పవన్', frequency: 50_000 },
  { roman: 'arjun', telugu: 'అర్జున్', frequency: 50_000 },
  { roman: 'keerthi', telugu: 'కీర్తి', frequency: 45_000 },
  { roman: 'sunitha', telugu: 'సునీత', frequency: 45_000 },
  { roman: 'lalitha', telugu: 'లలిత', frequency: 45_000 },
  { roman: 'anitha', telugu: 'అనిత', frequency: 45_000 },
  { roman: 'swetha', telugu: 'శ్వేత', frequency: 45_000 },
  { roman: 'deepika', telugu: 'దీపిక', frequency: 45_000 },
  { roman: 'priya', telugu: 'ప్రియ', frequency: 50_000 },
  { roman: 'pooja', telugu: 'పూజ', frequency: 50_000 },
  { roman: 'divya', telugu: 'దివ్య', frequency: 50_000 },
  { roman: 'prashanth', telugu: 'ప్రశాంత్', frequency: 45_000 },
  { roman: 'gautham', telugu: 'గౌతమ్', frequency: 45_000 },
  { roman: 'nithin', telugu: 'నితిన్', frequency: 45_000 },
  { roman: 'sandeep', telugu: 'సందీప్', frequency: 45_000 },

  { roman: 'lo', telugu: 'లో', frequency: 75_000 },
  { roman: 'nundi', telugu: 'నుండి', frequency: 65_000 },
  { roman: 'kosam', telugu: 'కోసం', frequency: 65_000 },
  { roman: 'daggara', telugu: 'దగ్గర', frequency: 60_000 },
  { roman: 'meeda', telugu: 'మీద', frequency: 60_000 },
  { roman: 'krinda', telugu: 'క్రింద', frequency: 55_000 },
  { roman: 'pakka', telugu: 'పక్క', frequency: 55_000 },
  { roman: 'vaddu', telugu: 'వద్దు', frequency: 65_000 },
  { roman: 'kavali', telugu: 'కావాలి', frequency: 70_000 },
  { roman: 'kavalanu', telugu: 'కావాలని', frequency: 50_000 },
  { roman: 'intlo', telugu: 'ఇంట్లో', frequency: 55_000 },
  { roman: 'intiki', telugu: 'ఇంటికి', frequency: 55_000 },
  { roman: 'dabbu', telugu: 'డబ్బు', frequency: 60_000 },
  { roman: 'unnanu', telugu: 'ఉన్నాను', frequency: 65_000 },
  { roman: 'unnadu', telugu: 'ఉన్నాడు', frequency: 60_000 },
  { roman: 'unnadi', telugu: 'ఉంది', frequency: 55_000 },
  { roman: 'vellanu', telugu: 'వెళ్ళాను', frequency: 55_000 },
  { roman: 'vellado', telugu: 'వెళ్ళాడు', frequency: 50_000 },
  { roman: 'vellindi', telugu: 'వెళ్ళింది', frequency: 50_000 },
  { roman: 'vastanu', telugu: 'వస్తాను', frequency: 55_000 },
  { roman: 'vastadu', telugu: 'వస్తాడు', frequency: 50_000 },
  { roman: 'chustanu', telugu: 'చూస్తాను', frequency: 50_000 },
  { roman: 'chusanu', telugu: 'చూశాను', frequency: 50_000 },
  { roman: 'ravali', telugu: 'రావాలి', frequency: 55_000 },
  { roman: 'povali', telugu: 'పోవాలి', frequency: 50_000 },
  { roman: 'cheyali', telugu: 'చేయాలి', frequency: 55_000 },
  { roman: 'theliyadu', telugu: 'తెలియదు', aliases: ['teliyadu'], frequency: 55_000 },
  { roman: 'telusu', telugu: 'తెలుసు', frequency: 65_000 },
  { roman: 'gurthu', telugu: 'గుర్తు', frequency: 55_000 },

  { roman: 'mobile', telugu: 'మొబైల్', frequency: 50_000 },
  { roman: 'phone', telugu: 'ఫోన్', frequency: 50_000 },
  { roman: 'number', telugu: 'నంబర్', frequency: 50_000 },
  { roman: 'message', telugu: 'మెసేజ్', frequency: 50_000 },
  { roman: 'movie', telugu: 'మూవీ', frequency: 50_000 },
  { roman: 'cinema', telugu: 'సినిమా', frequency: 50_000 },
  { roman: 'bus', telugu: 'బస్', frequency: 50_000 },
  { roman: 'train', telugu: 'ట్రైన్', frequency: 50_000 },
  { roman: 'computer', telugu: 'కంప్యూటర్', frequency: 50_000 },
  { roman: 'college', telugu: 'కాలేజీ', frequency: 50_000 },
  { roman: 'doctor', telugu: 'డాక్టర్', frequency: 50_000 },
  { roman: 'hospital', telugu: 'హాస్పిటల్', frequency: 50_000 },
  { roman: 'police', telugu: 'పోలీస్', frequency: 50_000 },
  { roman: 'auto', telugu: 'ఆటో', frequency: 50_000 },
  { roman: 'car', telugu: 'కార్', frequency: 50_000 },
  { roman: 'bike', telugu: 'బైక్', frequency: 50_000 },
  { roman: 'money', telugu: 'మనీ', frequency: 50_000 },
  { roman: 'time', telugu: 'టైమ్', frequency: 50_000 },
  { roman: 'problem', telugu: 'ప్రాబ్లమ్', frequency: 50_000 },
  { roman: 'business', telugu: 'బిజినెస్', frequency: 50_000 },
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
