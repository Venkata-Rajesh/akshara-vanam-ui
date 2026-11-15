import { authorAvatarColor, authorInitial } from './author-initial';

describe('authorInitial', () => {
  it('keeps Telugu vowel signs in the first initial', () => {
    expect(authorInitial('వెంకట')).toBe('వె');
  });

  it('trims leading whitespace before finding the initial', () => {
    expect(authorInitial('  వెంకట')).toBe('వె');
  });

  it('returns the first character for English names', () => {
    expect(authorInitial('Venkata')).toBe('V');
  });

  it('uses a fallback for an empty name', () => {
    expect(authorInitial('  ')).toBe('?');
  });

  it('assigns a stable color to the same normalized name', () => {
    expect(authorAvatarColor(' వెంకట ')).toBe(authorAvatarColor('వెంకట'));
    expect(authorAvatarColor('వెంకట')).toMatch(
      /^hsl\(\d+ 48% var\(--app-avatar-tonal-lightness\)\)$/,
    );
  });

  it('distributes different names across the avatar palette', () => {
    const colors = ['వెంకట', 'రమ్య', 'కిరణ్', 'సీత', 'అనిల్'].map(authorAvatarColor);
    expect(new Set(colors).size).toBeGreaterThan(1);
  });
});
