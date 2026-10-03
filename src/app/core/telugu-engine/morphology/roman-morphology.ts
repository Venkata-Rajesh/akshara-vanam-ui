export interface RomanMorphAnalysis {
  input: string;
  stem: string;
  suffixes: string[];
  score: number;
}
export class RomanTeluguMorphology {
  private readonly suffixes = [
    'maatrame',
    'matrame',
    'gurinchi',
    'nunchi',
    'nundi',
    'lekunda',
    'yokka',
    'kooda',
    'kosam',
    'valla',
    'loni',
    'kuda',
    'tho',
    'to',
    'lo',
    'ki',
    'ku',
    'ni',
    'nu',
    'lu',
    'ga',
    'pai',
  ];
  private readonly accusativeSuffixes = ['aanni', 'anni'];
  private readonly conditionalSuffixes = ['ayithe', 'ayite', 'aithe', 'aite'];

  analyzeAccusative(input: string): RomanMorphAnalysis | null {
    const value = input.toLowerCase();
    const suffix = this.accusativeSuffixes.find(
      (candidate) => value.endsWith(candidate) && value.length > candidate.length + 1,
    );
    if (!suffix) return null;

    return {
      input,
      stem: `${value.slice(0, -suffix.length)}am`,
      suffixes: [suffix],
      score: 8,
    };
  }

  analyzeEmphatic(input: string): RomanMorphAnalysis[] {
    const value = input.toLowerCase();
    if (!value.endsWith('e') || value.length < 4) return [];

    const base = value.slice(0, -1);
    return ['u', 'i'].map((ending) => ({
      input,
      stem: `${base}${ending}`,
      suffixes: ['e'],
      score: 6,
    }));
  }

  analyzeConditional(input: string): RomanMorphAnalysis[] {
    const value = input.toLowerCase();
    const suffix = this.conditionalSuffixes.find(
      (candidate) => value.endsWith(candidate) && value.length > candidate.length + 2,
    );
    if (!suffix) return [];

    const base = value.slice(0, -suffix.length);
    const ending = /[vw]$/.test(base) ? 'u' : /[dt]$/.test(base) ? 'i' : null;
    if (!ending) return [];

    return [
      {
        input,
        stem: `${base}${ending}`,
        suffixes: [suffix],
        score: 8,
      },
    ];
  }

  analyze(input: string): RomanMorphAnalysis {
    const accusative = this.analyzeAccusative(input);
    if (accusative) return accusative;

    const value = input.toLowerCase();
    const suffix = [...this.suffixes]
      .sort((a, b) => b.length - a.length)
      .find((candidate) => value.endsWith(candidate) && value.length > candidate.length);
    return suffix
      ? { input, stem: value.slice(0, -suffix.length), suffixes: [suffix], score: 4 }
      : { input, stem: value, suffixes: [], score: 0 };
  }
}
