import { describe, it, expect } from 'vitest';
import { parseChordPro } from '../parseChordPro';

describe('parseChordPro', () => {
  it('should extract title, artist, subtitle, key, tempo, and time signature', () => {
    const input = `
{title: Amazing Grace}
{artist: John Newton}
{subtitle: Hymn}
{key: G}
{tempo: 80}
{time: 3/4}
`;
    const result = parseChordPro(input);
    expect(result.title).toBe('Amazing Grace');
    expect(result.artist).toEqual(['John Newton']);
    expect(result.subtitle).toBe('Hymn');
    expect(result.key).toBe('G');
    expect(result.tempo).toBe(80);
    expect(result.timeSignature).toBe('3/4');
  });

  it('should parse multiple artists', () => {
    const input = `{artist: John Newton, Chris Tomlin}`;
    const result = parseChordPro(input);
    expect(result.artist).toEqual(['John Newton', 'Chris Tomlin']);
  });

  it('should parse ccli, copyright, and footer', () => {
    const input = `
{ccli: 123456}
{copyright: Public Domain}
{footer: Used by permission}
`;
    const result = parseChordPro(input);
    expect(result.ccliNumber).toBe('123456');
    expect(result.copyright).toBe('Public Domain');
    expect(result.footer).toBe('Used by permission');
  });

  it('should parse themes and deduplicate them', () => {
    const input = `
{themes: Grace, Mercy}
{theme: Forgiveness}
{themes: Grace}
`;
    const result = parseChordPro(input);
    expect(result.themes).toEqual(['Grace', 'Mercy', 'Forgiveness']);
  });

  it('should parse plain text header block', () => {
    const input = `Key - Eb | Tempo - 72 | Time - 4/4`;
    const result = parseChordPro(input);
    expect(result.key).toBe('Eb');
    expect(result.tempo).toBe(72);
    expect(result.timeSignature).toBe('4/4');
  });

  it('should strip chords, tabs, and syllable-extension dashes from lyrics', () => {
    const input = `
{title: Test Song}
{c: Verse 1}
You [Eb/G]have
au   -   [Bb]thori   -   [Ab]ty
[|][Ab]
`;
    const result = parseChordPro(input);
    expect(result.lyrics).toContain('[Verse 1]');
    expect(result.lyrics).toContain('You have');
    expect(result.lyrics).toContain('authority');
  });

  it('should handle structural section markers and sections array', () => {
    const input = `
{title: Test}
{c: Verse 1}
Line 1
{start_of_chorus}
Line 2
{end_of_chorus}
[Bridge]
Line 3
`;
    const result = parseChordPro(input);
    expect(result.sections).toEqual(['Verse 1', 'Bridge']);
    expect(result.lyrics).toContain('[Verse 1]');
    expect(result.lyrics).toContain('Line 1');
    expect(result.lyrics).toContain('Line 2');
    expect(result.lyrics).toContain('[Bridge]');
    expect(result.lyrics).toContain('Line 3');
  });

  it('should capture trailing CCLI block lines', () => {
    const input = `
Line 1
CCLI Song # 987654
© 2026 Admin
For use solely with the SongSelect terms
`;
    const result = parseChordPro(input);
    expect(result.ccliNumber).toBe('987654');
    expect(result.copyright).toBe('© 2026 Admin');
  });
});
