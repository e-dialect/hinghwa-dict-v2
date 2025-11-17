/**
 * Puxian dialect - Search and filter constants
 * Used for phonetic searches and filtering in the dictionary
 */

/**
 * Initial consonants with examples
 * Used for search filters
 */
export const initialConsonants: Record<string, string> = {
  all: 'all：全部声母',
  b: 'b：（买放笔）',
  p: 'p：（皮片拍）',
  m: 'm：（骂名目）',
  d: 'd；（刀中毒）',
  t: 't：（头天读）',
  n: 'n：（泥年肉）',
  l: 'l：（老连绿）',
  z: 'z：（早钱热）',
  c: 'c：（差清七）',
  s: 's：（时心十）',
  g: 'g：（加公月）',
  k: 'k：（气轻吸）',
  ng: 'ng：（五元硬）',
  h: 'h：（好远发）',
  Ǿ: 'Ǿ：（乌云压）',
};

/**
 * Final vowel/consonant groups
 * Organized hierarchically for dropdown selection
 */
export interface FinalOption {
  value: string;
  label: string;
  children?: FinalOption[];
}

export const finalVowels: FinalOption[] = [
  {
    value: 'all',
    label: 'all：全部韵母',
  },
  {
    value: 'kaiwei',
    label: '开尾韵（家学鱼）',
    children: [
      { value: 'a', label: 'a：（家拆）' },
      { value: 'ae', label: 'ae：（十）' },
      { value: 'e', label: 'e：（鞋鸡）' },
      { value: 'oe', label: 'oe：（退所）' },
      { value: 'o', label: 'o：（学刀）' },
      { value: 'i', label: 'i：（枝戏）' },
      { value: 'y', label: 'y：（鱼猪）' },
      { value: 'u', label: 'u：（有牛）' },
      { value: 'ai', label: 'ai：（菜海）' },
      { value: 'ao', label: 'ao：（后豆）' },
      { value: 'ou', label: 'ou：（乌古）' },
      { value: 'ia', label: 'ia：（车谢）' },
      { value: 'ieo', label: 'ieo：（药鸟）' },
      { value: 'iu', label: 'iu：（油救）' },
      { value: 'ua', label: 'ua：（画花）' },
      { value: 'ue', label: 'ue：（歪飞）' },
      { value: 'ui', label: 'ui：（位水）' },
      { value: 'yo', label: 'yo：（蛇鹅）' },
    ],
  },
  {
    value: 'biwei',
    label: '鼻尾韵（灯冰斤）',
    children: [
      { value: 'ang', label: 'ang：（红重）' },
      { value: 'orng', label: 'orng：（王公）' },
      { value: 'eng', label: 'eng：（灯生）' },
      { value: 'oeng', label: 'oeng：（宫窗）' },
      { value: 'ong', label: 'ong：（云分）' },
      { value: 'ing', label: 'ing：（冰心）' },
      { value: 'ieng', label: 'ieng：（盐尖）' },
      { value: 'ung', label: 'ung：（光霜）' },
      { value: 'uang', label: 'uang：（弯团）' },
      { value: 'yng', label: 'yng：（斤银）' },
      { value: 'yong', label: 'yong：（上场）' },
      { value: 'ng', label: 'ng：（黄方）' },
    ],
  },
  {
    value: 'saiwei',
    label: '塞尾韵（合笔食）',
    children: [
      { value: 'ah', label: 'ah：（合读）' },
      { value: 'orh', label: 'orh：（盒国）' },
      { value: 'eh', label: 'eh：（踢热）' },
      { value: 'oeh', label: 'oeh：（竹玉）' },
      { value: 'oh', label: 'oh：（出骨）' },
      { value: 'ih', label: 'ih：（笔七）' },
      { value: 'iah', label: 'iah：（食揲）' },
      { value: 'ieh', label: 'ieh：（页业）' },
      { value: 'uh', label: 'uh：（*）' },
      { value: 'uah', label: 'uah：（刷发）' },
      { value: 'uoh', label: 'uoh：（我）' },
      { value: 'yh', label: 'yh：（疫域）' },
      { value: 'yoh', label: 'yoh：（约雀）' },
    ],
  },
];
