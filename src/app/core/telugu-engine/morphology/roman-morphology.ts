export interface RomanMorphAnalysis { input: string; stem: string; suffixes: string[]; score: number; }
export class RomanTeluguMorphology {
  private readonly suffixes = ['maatrame', 'matrame', 'gurinchi', 'nunchi', 'nundi', 'lekunda', 'yokka', 'kooda', 'kosam', 'valla', 'loni', 'kuda', 'tho', 'to', 'lo', 'ki', 'ku', 'ni', 'nu', 'lu', 'ga', 'pai'];
  analyze(input: string): RomanMorphAnalysis {
    const value = input.toLowerCase();
    const suffix = [...this.suffixes].sort((a, b) => b.length - a.length).find((candidate) => value.endsWith(candidate) && value.length > candidate.length);
    return suffix ? { input, stem: value.slice(0, -suffix.length), suffixes: [suffix], score: 4 } : { input, stem: value, suffixes: [], score: 0 };
  }
}
