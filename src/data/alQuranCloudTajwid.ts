import { TAJWID_COLOR_MAP, type TajwidRuleKey, type TajwidToken } from './tajwidRules';

const CODE_TO_RULE: Record<string, TajwidRuleKey | undefined> = {
  h: undefined,
  s: undefined,
  l: undefined,
  n: 'mad_thobii',
  p: 'mad_jaiz',
  m: 'mad_lazim',
  o: 'mad_wajib',
  q: 'qalqalah',
  c: 'ikhfa_syafawi',
  f: 'ikhfa_haqiqi',
  w: 'idgham_mimi',
  i: 'iqlab',
  a: 'idgham_bighunnah',
  u: 'idgham_bilaghunnah',
  d: undefined,
  b: undefined,
  g: 'ghunnah'
};

const WAQAF_RULES: Record<string, TajwidRuleKey> = {
  'ۘ': 'waqaf_lazim',
  'ۚ': 'waqaf_jaiz',
  'ۗ': 'waqaf_aula',
  'ۖ': 'washal_aula',
  'ۙ': 'waqaf_mamnu',
  'ۛ': 'waqaf_muanaqah',
  'ۜ': 'saktah'
};

function appendToken(tokens: TajwidToken[], text: string, rule?: TajwidRuleKey): void {
  if (!text) return;
  const label = rule ? TAJWID_COLOR_MAP[rule]?.label : undefined;
  const previous = tokens[tokens.length - 1];
  if (previous && previous.rule === rule && previous.label === label) {
    previous.text += text;
  } else {
    tokens.push({ text, rule, label });
  }
}

function appendWithWaqaf(tokens: TajwidToken[], text: string, rule?: TajwidRuleKey): void {
  let plain = '';
  for (const character of text) {
    const waqafRule = WAQAF_RULES[character];
    if (!waqafRule) {
      plain += character;
      continue;
    }
    appendToken(tokens, plain, rule);
    plain = '';
    appendToken(tokens, character, waqafRule);
  }
  appendToken(tokens, plain, rule);
}

/** Parses AlQuran Cloud quran-tajweed bracket notation without rendering HTML. */
export function parseAlQuranCloudTajwid(markup: string): TajwidToken[] {
  if (!markup) return [];

  const tokens: TajwidToken[] = [];
  let plain = '';
  let index = 0;

  const flushPlain = () => {
    appendWithWaqaf(tokens, plain);
    plain = '';
  };

  while (index < markup.length) {
    if (markup[index] !== '[') {
      plain += markup[index++];
      continue;
    }

    const tagMatch = markup.slice(index).match(/^\[([a-z])(?::\d+)?\[/i);
    if (!tagMatch) {
      // A malformed opening marker is metadata, not Quran text.
      index++;
      continue;
    }

    flushPlain();
    const contentStart = index + tagMatch[0].length;
    const contentEnd = markup.indexOf(']', contentStart);
    if (contentEnd === -1) {
      appendWithWaqaf(tokens, markup.slice(contentStart), CODE_TO_RULE[tagMatch[1].toLowerCase()]);
      break;
    }

    appendWithWaqaf(
      tokens,
      markup.slice(contentStart, contentEnd),
      CODE_TO_RULE[tagMatch[1].toLowerCase()]
    );
    index = contentEnd + 1;
  }

  flushPlain();
  return tokens;
}

export function stripAlQuranCloudTajwid(markup: string): string {
  return parseAlQuranCloudTajwid(markup).map((token) => token.text).join('');
}
