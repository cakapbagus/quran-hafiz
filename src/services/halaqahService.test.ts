import { describe, expect, it } from 'vitest';
import { generateCode, normalizeCode, validCode, validateVerse } from './halaqahService';

describe('Kode Guru', () => {
  it('normalizes lowercase and outer whitespace', () => expect(normalizeCode(' a7k9x2 ')).toBe('A7K9X2'));
  it('requires six characters with letters and numbers', () => {
    for (const code of ['ABCDEF', '123456', 'A1', 'A1BCDEF', 'A1-BCD', 'a7k9x2']) expect(validCode(code)).toBe(false);
    expect(validCode('A7K9X2')).toBe(true);
  });
  it('generates valid random codes', () => { const codes = Array.from({ length: 200 }, generateCode); expect(codes.every(validCode)).toBe(true); expect(new Set(codes).size).toBe(200); });
});
describe('Hafalan validation', () => {
  const base = { surahNumber: 1, verseNumber: 7, status: 'memorized' as const, repeatCount: 0 };
  it('accepts a valid verse', () => expect(() => validateVerse(base)).not.toThrow());
  it('rejects invalid ranges and notes', () => {
    for (const change of [{ verseNumber: 8 }, { verseNumber: 1.5 }, { surahNumber: 115 }, { repeatCount: -1 }, { notes: 'x'.repeat(2001) }]) expect(() => validateVerse({ ...base, ...change })).toThrow();
  });
});
