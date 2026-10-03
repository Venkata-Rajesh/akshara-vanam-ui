import { TeluguEditorEngine } from './telugu-editor-engine';
import { composePhonemes } from './telugu/composer';

describe('Telugu language engine', () => {
  const engine = new TeluguEditorEngine();
  it('generates unknown words', () =>
    expect(engine.transliterateWord('hyderabad').best?.text).toBeTruthy());
  it('composes clusters as aksharas', () =>
    expect(
      composePhonemes([
        { type: 'consonant', value: 'k' },
        { type: 'consonant', value: 'r' },
        { type: 'vowel', value: 'a' },
      ]),
    ).toBe('క్ర'));
  it('ranks lexical variants over generated guesses', () =>
    expect(engine.transliterateWord('naaku').best?.text).toBe('నాకు'));
  it('keeps similar short words distinct', () => {
    expect(engine.transliterateWord('nenu').best?.text).toBe('నేను');
    expect(engine.transliterateWord('ninnu').best?.text).toBe('నిన్ను');
  });
  it('accepts normal English-style casing without changing RTS capitals', () => {
    expect(engine.transliterateWord('Nenu').best?.text).toBe('నేను');
    expect(engine.transliterateWord('Namaskaram').best?.text).toBe('నమస్కారం');
    expect(engine.transliterateWord('Takkari').best?.text).toBe('టక్కరి');
  });
  it('covers high-frequency casual Roman Telugu vocabulary', () => {
    expect(engine.transliterateWord('chaala').best?.text).toBe('చాలా');
    expect(engine.transliterateWord('baagundi').best?.text).toBe('బాగుంది');
    expect(engine.transliterateWord('baagunnaru').best?.text).toBe('బాగున్నారు');
    expect(engine.transliterateWord('baagunnara').best?.text).toBe('బాగున్నారా');
    expect(engine.transliterateWord('emiti').best?.text).toBe('ఏమిటి');
    expect(engine.transliterateWord('enti').best?.text).toBe('ఏంటి');
    expect(engine.transliterateWord('thammudu').best?.text).toBe('తమ్ముడు');
    expect(engine.transliterateWord('annam').best?.text).toBe('అన్నం');
    expect(engine.transliterateWord('vellali').best?.text).toBe('వెళ్ళాలి');
    expect(engine.transliterateWord('vijayawada').best?.text).toBe('విజయవాడ');
    expect(engine.transliterateWord('andamaina').best?.text).toBe('అందమైన');
    expect(engine.transliterateWord('vennela').best?.text).toBe('వెన్నెల');
    expect(engine.transliterateWord('hyderabad').best?.text).toBe('హైదరాబాద్');
  });
  it('uses curated spellings for common names, postpositions, and loanwords', () => {
    expect(engine.transliterateWord('kooda').best?.text).toBe('కూడా');
    expect(engine.transliterateWord('nundi').best?.text).toBe('నుండి');
    expect(engine.transliterateWord('rajahmundry').best?.text).toBe('రాజమండ్రి');
    expect(engine.transliterateWord('srinivas').best?.text).toBe('శ్రీనివాస్');
    expect(engine.transliterateWord('mobile').best?.text).toBe('మొబైల్');
    expect(engine.transliterateWord('andaru').best?.text).toBe('అందరూ');
    expect(engine.transliterateWord('andariki').best?.text).toBe('అందరికీ');
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
    expect(engine.transliterateText('ela nee pai kaligina korika velluvai vachindi')).toBe(
      'ఎలా నీ పై కలిగిన కోరిక వెల్లువై వచ్చింది',
    );
  });
  it('converts a Roman Telugu phrase without touching Markdown code', () => {
    expect(engine.transliterateText('nenu telugu lo `const nenu = true`')).toBe(
      'నేను తెలుగు లో `const nenu = true`',
    );
  });
  it('gives registered phrases precedence over word-by-word output', () => {
    expect(engine.transliterateText('ela unnaru')).toBe('ఎలా ఉన్నారు');
  });
  it('supports contextual candidates', () =>
    expect(
      engine.suggest({
        before: 'nenu',
        current: 'hyderabad',
        after: 'lo vellanu',
        languageMode: 'mixed',
      }).length,
    ).toBeGreaterThan(0));
  it('learns user vocabulary', () => {
    engine.remember('rajesh', 'రాజేష్');
    expect(engine.transliterateWord('rajesh').best?.text).toBe('రాజేష్');
  });
  it('respects standard RTS capitalization for retroflex sounds', () => {
    expect(engine.transliterateWord('Takkari').best?.text).toBe('టక్కరి');
    expect(engine.transliterateWord('Daabu').best?.text).toBe('డాబు');
  });
  it('handles word-final consonants properly', () => {
    // If it falls back, it should be sir -> సిర్, not సిర
    expect(engine.transliterateWord('sir').best?.text).toBe('సిర్');
  });
  it('supports RTS Anusvara (M) and Visarga (H)', () => {
    expect(engine.transliterateWord('aMtaM').best?.text).toBe('అంతం');
    expect(engine.transliterateWord('ahaH').best?.text).toBe('అహః');
  });
  it('supports standard S, sh, Sh mappings', () => {
    expect(engine.transliterateWord('Sankaram').best?.text).toBe('శంకరం');
    expect(engine.transliterateWord('shiva').best?.text).toBe('శివ');
    expect(engine.transliterateWord('bhAShA').best?.text).toBe('భాషా');
  });
});
