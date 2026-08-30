import { describe, expect, it } from 'vitest';
import { parseArabicTajwid, TajwidRuleKey } from './tajwidRules';

const coloredText = (text: string, rule: TajwidRuleKey) =>
  parseArabicTajwid(text)
    .filter((token) => token.rule === rule)
    .map((token) => token.text)
    .join('');

describe('parseArabicTajwid', () => {
  it('colors only nun and mim musyaddadah as ghunnah', () => {
    expect(coloredText('إِنَّ اللَّهَ ثُمَّ كَلَّا', 'ghunnah')).toBe('نَّمَّ');
  });

  it('detects qalqalah sughra and qalqalah at the end of a verse', () => {
    expect(coloredText('يَجْعَلُونَ أَحَدٌ', 'qalqalah')).toBe('جْدٌ');
  });

  it('detects ikhfa haqiqi for nun sakinah and tanwin', () => {
    expect(coloredText('مِنْ كُلِّ كِتَابٌ كَرِيمٌ', 'ikhfa_haqiqi')).toBe('نْكُبٌكَ');
  });

  it('detects idgham bighunnah across word boundaries', () => {
    expect(coloredText('مِنْ يَقُولُ عَلِيمٌ وَاسِعٌ', 'idgham_bighunnah')).toBe('نْيَمٌوَ');
  });

  it('detects idgham bilaghunnah including a bare Uthmani nun', () => {
    expect(coloredText('مِن رَّبِّهِمْ غَفُورٌ رَّحِيمٌ', 'idgham_bilaghunnah')).toBe('نرَّرٌرَّ');
  });

  it('detects iqlab for tanwin followed by ba', () => {
    expect(coloredText('عَلِيمٌ بِذَاتِ الصُّدُورِ', 'iqlab')).toBe('مٌبِ');
  });

  it('detects ikhfa syafawi and idgham mimi', () => {
    const text = 'هُمْ بِهِ لَهُمْ مَّا يَشَاءُونَ';

    expect(coloredText(text, 'ikhfa_syafawi')).toBe('مْبِ');
    expect(coloredText(text, 'idgham_mimi')).toBe('مْمَّ');
  });

  it('does not classify idgham letters inside one word', () => {
    expect(coloredText('الدُّنْيَا', 'idgham_bighunnah')).toBe('');
  });

  it('detects mad thabii for alif, ya, and waw mad', () => {
    expect(coloredText('قَالَ فِي يَقُولُ كَتَبَ', 'mad_thobii')).toBe('ايو');
  });

  it('detects mad arid lissukun at the end of a verse', () => {
    expect(coloredText('الْعَالَمِينَ', 'mad_arid')).toBe('ينَ');
  });

  it('detects mad lazim before a letter with shaddah and on its Uthmani marker', () => {
    expect(coloredText('الضَّآلِّينَ كَتَبَ', 'mad_lazim')).toBe('آلِّ');
    expect(coloredText('الۤمّۤ', 'mad_lazim')).toBe('لۤمّۤ');
  });

  it('detects mad wajib muttashil before hamzah in one word', () => {
    expect(coloredText('جَآءَ كَتَبَ', 'mad_wajib')).toBe('آءَ');
  });

  it('keeps lafzul jalalah intact without splitting it into colored tokens', () => {
    expect(parseArabicTajwid('اللَّٰهِ')).toEqual([
      { text: 'اللَّٰهِ', rule: undefined, label: undefined }
    ]);
    expect(coloredText('بِاللَّٰهِ', 'mad_thobii')).toBe('');
  });
});
