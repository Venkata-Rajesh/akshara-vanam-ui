import { Token, TokenType } from '../types';
import { isTeluguCharacter } from '../unicode';
function classify(value: string): TokenType {
  if (/^\s+$/.test(value)) return 'whitespace';
  if (/^[0-9]+(?:[.,][0-9]+)*$/.test(value)) return 'number';
  if (/^[\p{P}\p{S}]+$/u.test(value)) return 'punctuation';
  if ([...value].some(isTeluguCharacter)) return 'telugu';
  return /^[A-Za-z]+$/.test(value) ? 'word' : 'english';
}
export function tokenize(input: string): Token[] {
  const tokens: Token[] = []; const regex = /(\s+|[\p{P}\p{S}]+|[A-Za-z]+|[0-9]+(?:[.,][0-9]+)*|[^\s\p{P}\p{S}]+)/gu;
  for (const match of input.matchAll(regex)) { const text = match[0]; const start = match.index ?? 0; tokens.push({ text, type: classify(text), start, end: start + text.length }); }
  return tokens;
}
