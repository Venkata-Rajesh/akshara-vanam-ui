import { TeluguEditorEngine } from './telugu-editor-engine';
import { composePhonemes } from './telugu/composer';

describe('Telugu language engine', () => {
  const engine = new TeluguEditorEngine();
  it('generates unknown words', () => expect(engine.transliterateWord('hyderabad').best?.text).toBeTruthy());
  it('composes clusters as aksharas', () => expect(composePhonemes([{ type: 'consonant', value: 'k' }, { type: 'consonant', value: 'r' }, { type: 'vowel', value: 'a' }])).toBe('క్ర'));
  it('ranks lexical variants over generated guesses', () => expect(engine.transliterateWord('naaku').best?.text).toBe('నాకు'));
  it('keeps similar short words distinct', () => {
    expect(engine.transliterateWord('nenu').best?.text).toBe('నేను');
    expect(engine.transliterateWord('ninnu').best?.text).toBe('నిన్ను');
  });
  it('recognizes common informal long-vowel spellings', () => {
    expect(engine.transliterateWord('ela').best?.text).toBe('ఎలా');
  });
  it('keeps multi-letter Roman sound units intact', () => {
    expect(engine.transliterateWord('nee').best?.text).toBe('నీ');
    expect(engine.transliterateWord('pai').best?.text).toBe('పై');
    expect(engine.transliterateWord('velluvai').best?.text).toBe('వెల్లువై');
  });
  it('transliterates a complete informal sentence naturally', () => {
    expect(engine.transliterateText('ela nee pai kaligina korika velluvai vachindi'))
      .toBe('ఎలా నీ పై కలిగిన కోరిక వెల్లువై వచ్చింది');
  });
  it('converts a Roman Telugu phrase without touching Markdown code', () => {
    expect(engine.transliterateText('nenu telugu lo `const nenu = true`')).toBe('నేను తెలుగు లో `const nenu = true`');
  });
  it('gives registered phrases precedence over word-by-word output', () => {
    expect(engine.transliterateText('ela unnaru')).toBe('ఎలా ఉన్నారు');
  });
  it('supports contextual candidates', () => expect(engine.suggest({ before: 'nenu', current: 'hyderabad', after: 'lo vellanu', languageMode: 'mixed' }).length).toBeGreaterThan(0));
  it('learns user vocabulary', () => { engine.remember('rajesh', 'రాజేష్'); expect(engine.transliterateWord('rajesh').best?.text).toBe('రాజేష్'); });
});
