import { describe, expect, it } from 'vitest';
import {
  isWaqafRule,
  parseArabicTajwid,
  TAJWID_COLOR_MAP,
  TAJWID_RULES,
  TajwidRuleKey
} from './tajwidRules';

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

  it('detects ikhfa haqiqi for tanwin fathah with trailing alif followed by an ikhfa letter', () => {
    // رً in بَصِيرًا carries tanwin fathah; the alif after it is orthographic, not the next word
    expect(coloredText('بَصِيرًا كَذَلِكَ', 'ikhfa_haqiqi')).toBe('رًكَ');
  });

  it('detects idgham bighunnah for tanwin fathah followed by ya across a word boundary', () => {
    // يَوْمًا يَرَوْنَهُ -- مً carries tanwin fathah, next word starts with ya
    expect(coloredText('يَوْمًا يَرَوْنَهُ', 'idgham_bighunnah')).toBe('مًيَ');
  });

  it('detects iqlab for tanwin fathah followed by ba across a word boundary', () => {
    // خَيْرًا بَلِ -- tanwin fathah then ba
    expect(coloredText('خَيْرًا بَلِ', 'iqlab')).toBe('رًبَ');
  });

  it('detects ikhfa syafawi and idgham mimi', () => {
    const text = 'هُمْ بِهِ لَهُمْ مَّا يَشَاءُونَ';

    expect(coloredText(text, 'ikhfa_syafawi')).toBe('مْبِ');
    expect(coloredText(text, 'idgham_mimi')).toBe('مْمَّ');
  });

  it('uses the same color coding for ikhfa haqiqi and ikhfa syafawi', () => {
    const haqiqiRule = TAJWID_RULES.find((rule) => rule.key === 'ikhfa_haqiqi');
    const syafawiRule = TAJWID_RULES.find((rule) => rule.key === 'ikhfa_syafawi');

    expect(TAJWID_COLOR_MAP.ikhfa_syafawi).toMatchObject({
      color: TAJWID_COLOR_MAP.ikhfa_haqiqi.color,
      bg: TAJWID_COLOR_MAP.ikhfa_haqiqi.bg
    });
    expect(syafawiRule).toMatchObject({
      color: haqiqiRule?.color,
      bgColor: haqiqiRule?.bgColor,
      textColor: haqiqiRule?.textColor,
      borderColor: haqiqiRule?.borderColor
    });
  });

  it('uses the same color coding for all ghunnah rules', () => {
    const ghunnahRule = TAJWID_RULES.find((rule) => rule.key === 'ghunnah');

    for (const ruleKey of ['idgham_bighunnah', 'idgham_mimi'] as const) {
      const rule = TAJWID_RULES.find((item) => item.key === ruleKey);

      expect(TAJWID_COLOR_MAP[ruleKey]).toMatchObject({
        color: TAJWID_COLOR_MAP.ghunnah.color,
        bg: TAJWID_COLOR_MAP.ghunnah.bg
      });
      expect(rule).toMatchObject({
        color: ghunnahRule?.color,
        bgColor: ghunnahRule?.bgColor,
        textColor: ghunnahRule?.textColor,
        borderColor: ghunnahRule?.borderColor
      });
    }
  });

  it('does not color izhar halqi or izhar syafawi', () => {
    expect(coloredText('مَنْ آمَنَ مِنْ حَكِيمٍ أَنْعَمْتَ', 'izhar_halqi')).toBe('');
    expect(coloredText('أَلَمْ تَرَ لَعَلَّكُمْ تَتَّقُونَ', 'izhar_syafawi')).toBe('');
  });

  it('does not classify idgham letters inside one word', () => {
    expect(coloredText('الدُّنْيَا', 'idgham_bighunnah')).toBe('');
  });

  it('detects mad thabii for alif, ya, and waw mad', () => {
    expect(coloredText('قَالَ فِي يَقُولُ كَتَبَ', 'mad_thobii')).toBe('ايو');
  });

  it('detects mad thabii in innaa after a letter with shaddah', () => {
    expect(coloredText('إِنَّا', 'mad_thobii')).toBe('ا');
    expect(coloredText('إِنَّا', 'mad_thobii')).toBe('ا');
  });

  it('detects mad jaiz when a final mad meets a vowelled alif in the next word', () => {
    // Bentuk persis equran.id: hamzah awal kata ditulis sebagai alif berharakat.
    expect(coloredText('اِنَّآ اَعْطَيْنٰكَ', 'mad_jaiz')).toBe('آاَ');
    expect(coloredText('اٰمَنُوْٓا اَوْفُوْا', 'mad_jaiz')).toBe('وْٓاَ');
    expect(coloredText('اٰمَنُوْٓا اَوْفُوْا', 'mad_thobii')).not.toContain('وْٓ');
  });

  it('does not color mad thabi\'i as 2 harakat when followed by sukun or tasydid across word boundary', () => {
    // فِي الْأَرْضِ -> ya mad dibaca pendek karena bertemu lam sukun saat washal
    expect(coloredText('فِي الْأَرْضِ', 'mad_thobii')).toBe('');
    // فِي الدِّينِ -> ya mad gugur karena bertemu huruf bertasydid saat washal
    expect(coloredText('فِي الدِّينِ', 'mad_thobii')).toBe('');
    // مَا النَّاسُ -> alif mad gugur
    expect(coloredText('مَا النَّاسُ', 'mad_thobii')).toBe('');
  });

  it('does not color mad thabii immediately before lafzul jalalah', () => {
    expect(coloredText('فِي اللَّهِ', 'mad_thobii')).toBe('');
    expect(coloredText('إِلَى اللّٰهِ', 'mad_thobii')).toBe('');
    // Alif pada قَا tetap Mad Thabi'i; waw jamaah tepat sebelum Allah tidak diwarnai.
    expect(coloredText('قَالُوا اللهُ', 'mad_thobii')).toBe('ا');

    expect(coloredText('فِي كِتَابٍ', 'mad_thobii')).toBe('ي');
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

  it('uses consistent colors for jaiz, washal aula, and mamnu waqaf rules', () => {
    expect(TAJWID_COLOR_MAP.waqaf_jaiz.color).toBe('#F59E0B');
    expect(TAJWID_COLOR_MAP.washal_aula.color).toBe('#10B981');
    expect(TAJWID_COLOR_MAP.waqaf_mamnu.color).toBe('#64748B');

    expect(TAJWID_RULES.find((rule) => rule.key === 'waqaf_jaiz')?.color).toBe('#F59E0B');
    expect(TAJWID_RULES.find((rule) => rule.key === 'washal_aula')?.color).toBe('#10B981');
    expect(TAJWID_RULES.find((rule) => rule.key === 'waqaf_mamnu')?.color).toBe('#64748B');
  });

  it('colors only the waqaf symbols in parsed Quran text', () => {
    expect(coloredText('بِالْحَقِّ ۚ إِنَّهُمْ', 'waqaf_jaiz')).toBe('ۚ');
    expect(coloredText('إِلَّا هُوَ ۖ', 'washal_aula')).toBe('ۖ');
    expect(coloredText('طَيِّبِينَ ۙ يَقُولُونَ', 'waqaf_mamnu')).toBe('ۙ');
  });

  it('separates waqaf symbols attached to Arabic letters into their own tokens', () => {
    const tokens = parseArabicTajwid('بِالْحَقِّۚإِنَّهُمْ');
    const waqafToken = tokens.find((token) => token.rule === 'waqaf_jaiz');

    expect(waqafToken?.text).toBe('ۚ');
    expect(tokens.some((token) => token.rule === 'waqaf_jaiz' && token.text.includes('ق'))).toBe(false);
    expect(tokens.map((token) => token.text).join('')).toBe('بِالْحَقِّۚإِنَّهُمْ');
  });

  it('identifies waqaf tokens that need visual spacing', () => {
    expect(isWaqafRule('waqaf_jaiz')).toBe(true);
    expect(isWaqafRule('washal_aula')).toBe(true);
    expect(isWaqafRule('saktah')).toBe(true);
    expect(isWaqafRule('mad_thobii')).toBe(false);
    expect(isWaqafRule(undefined)).toBe(false);
  });

  it('keeps lafzul jalalah intact without splitting it into colored tokens', () => {
    expect(parseArabicTajwid('اللَّٰهِ')).toEqual([
      { text: 'اللَّٰهِ', rule: undefined, label: undefined }
    ]);
    expect(coloredText('بِاللَّٰهِ', 'mad_thobii')).toBe('');
  });
});
