import { describe, expect, it } from 'vitest';
import { parseAlQuranCloudTajwid, stripAlQuranCloudTajwid } from './alQuranCloudTajwid';

describe('parseAlQuranCloudTajwid', () => {
  it('removes notation while preserving the exact Quran text', () => {
    const markup = 'بِسْمِ [h:1[ٱ]للَّهِ [h:2[ٱ][l[ل]رَّحْمَ[n[ـٰ]نِ';
    expect(stripAlQuranCloudTajwid(markup)).toBe('بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ');
  });

  it('maps official codes to the existing application rules', () => {
    const tokens = parseAlQuranCloudTajwid('[g[نّ] [q:15[قْ] [f:18[ن ق] [i:43[مُۢ ب]');
    expect(tokens).toEqual([
      expect.objectContaining({ text: 'نّ', rule: 'ghunnah' }),
      expect.objectContaining({ text: ' ', rule: undefined }),
      expect.objectContaining({ text: 'قْ', rule: 'qalqalah' }),
      expect.objectContaining({ text: ' ', rule: undefined }),
      expect.objectContaining({ text: 'ن ق', rule: 'ikhfa_haqiqi' }),
      expect.objectContaining({ text: ' ', rule: undefined }),
      expect.objectContaining({ text: 'مُۢ ب', rule: 'iqlab' })
    ]);
  });

  it('uses the official necessary and obligatory madd mapping', () => {
    const tokens = parseAlQuranCloudTajwid('[m[آ] [o[آ]');
    expect(tokens[0].rule).toBe('mad_lazim');
    expect(tokens[2].rule).toBe('mad_wajib');
  });

  it('renders unsupported and malformed annotations as plain text without leaking markers', () => {
    expect(stripAlQuranCloudTajwid('[d[ت] [z:9[ب] [g[نّ')).toBe('ت ب نّ');
  });

  it('separates waqaf symbols from annotated and plain segments', () => {
    const tokens = parseAlQuranCloudTajwid('حَقّۚ [g[نّۖ]');
    expect(tokens.find((token) => token.text === 'ۚ')?.rule).toBe('waqaf_jaiz');
    expect(tokens.find((token) => token.text === 'ۖ')?.rule).toBe('washal_aula');
    expect(tokens.map((token) => token.text).join('')).toBe('حَقّۚ نّۖ');
  });
});
