const graphemeSegmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
const avatarHuePalette = [195, 102, 17, 271, 210, 33, 344, 163, 43, 231, 23, 198];

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
  const hue = avatarHuePalette[(hash >>> 0) % avatarHuePalette.length];
  return `hsl(${hue} 48% var(--app-avatar-tonal-lightness))`;
}
