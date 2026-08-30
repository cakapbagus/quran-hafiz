import { describe, expect, it } from 'vitest';
import { formatInitialHint } from './HafalanModeView';

describe('formatInitialHint', () => {
  it('returns only the first word when a verse contains multiple words', () => {
    expect(formatInitialHint('بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ')).toBe('بِسْمِ...');
  });

  it('returns only the first letter and its marks for a single-word verse', () => {
    expect(formatInitialHint('الْحَاقَّةُ')).toBe('ا...');
    expect(formatInitialHint('قُلْ')).toBe('قُ...');
  });

  it('returns an empty string for blank input', () => {
    expect(formatInitialHint('   ')).toBe('');
  });
});
