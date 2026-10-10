const graphemeSegmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
const avatarPalette = [
  '#315c6a',
  '#45613c',
  '#92513a',
  '#664b79',
  '#3f5e7a',
  '#88571f',
  '#8d4055',
  '#3c6258',
  '#6a5337',
  '#4c5780',
  '#7c5034',
  '#37647a',
];

export function authorInitial(author: string): string {
  const name = author.trim();
  const initial = graphemeSegmenter.segment(name)[Symbol.iterator]().next().value?.segment;
  return initial?.replace(/[\u0c02\u0c03]+$/u, '') || initial || '?';
}

export function authorAvatarColor(name: string): string {
  let hash = 2166136261;
  for (const character of name.trim().normalize('NFC').toLocaleLowerCase()) {
    hash = Math.imul(hash ^ character.codePointAt(0)!, 16777619);
  }
  return avatarPalette[(hash >>> 0) % avatarPalette.length];
}
