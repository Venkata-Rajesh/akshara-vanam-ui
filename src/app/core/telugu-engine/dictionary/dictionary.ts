import { DictionaryEntry } from '../types';
import { normalizeRoman } from '../roman/normalizer';

export interface TeluguDictionary { lookup(roman: string): DictionaryEntry[]; add(entry: DictionaryEntry): void; entries?(): DictionaryEntry[]; }
export class MemoryTeluguDictionary implements TeluguDictionary {
  private readonly map = new Map<string, DictionaryEntry[]>();
  private readonly allEntries = new Map<string, DictionaryEntry>();
  constructor(entries: DictionaryEntry[] = []) { entries.forEach((entry) => this.add(entry)); }
  add(entry: DictionaryEntry): void {
    this.allEntries.set(`${entry.roman}:${entry.telugu}`, entry);
    this.insert(entry.roman, entry);
    entry.aliases?.forEach((alias) => this.insert(alias, entry));
  }
  lookup(roman: string): DictionaryEntry[] { return [...(this.map.get(normalizeRoman(roman).compact) ?? [])]; }
  entries(): DictionaryEntry[] { return [...this.allEntries.values()]; }
  private insert(roman: string, entry: DictionaryEntry): void {
    const key = normalizeRoman(roman).compact;
    const values = this.map.get(key) ?? [];
    if (!values.includes(entry)) values.push(entry);
    values.sort((a, b) => (b.frequency ?? 0) - (a.frequency ?? 0));
    this.map.set(key, values);
  }
}

export class UserTeluguDictionary extends MemoryTeluguDictionary {
  remember(roman: string, telugu: string): void { this.add({ roman, telugu, frequency: 1_000_000, tags: ['user'] }); }
}
