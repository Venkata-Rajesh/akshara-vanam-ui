export interface MorphologicalAnalysis { surface: string; stem: string; suffixes: string[]; score: number; }
export class TeluguMorphology {
  private readonly suffixes = ['మాత్రమే', 'గురించి', 'లేకుండా', 'నుండి', 'కోసం', 'యొక్క', 'కూడా', 'లోని', 'వల్ల', 'తో', 'లో', 'కి', 'కు', 'ని', 'ను', 'లు', 'గా', 'పై'];
  analyze(word: string): MorphologicalAnalysis {
    const suffix = this.suffixes.find((candidate) => word.endsWith(candidate) && word.length > candidate.length);
    return suffix ? { surface: word, stem: word.slice(0, -suffix.length), suffixes: [suffix], score: 3 } : { surface: word, stem: word, suffixes: [], score: 0 };
  }
}
