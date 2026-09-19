/**
 * 디자인 토큰. 값은 디자인 시안(SF/*.svg)과 디자이너 라이브 사이트의 CSS에서 가져왔다.
 * 색·크기·글꼴은 여기서만 정의한다.
 */

export const colors = {
  /** 아이 화면(오늘·소리여행) */
  ground: '#FAF8F5',
  /** 부모·설정 화면 */
  groundParent: '#F7F3EC',
  frame: '#DFF2ED',
  surface: '#FFFFFF',
  ink: '#2C3E38',
  inkSoft: '#6F7F79',
  inkMuted: '#7C8B85',
  inkFaint: '#91A09B',
  line: '#DEDBD4',
  lineSoft: '#E8E3DC',
  dashed: '#C9C2B8',

  brand: '#35AD86',
  navActive: '#256B61',
  navActiveBg: '#E0F3EE',
  navIdle: '#91A09B',

  heroFrom: '#FFE472',
  heroTo: '#FFCD33',
  weekFrom: '#FFE981',
  weekTo: '#FFD33F',
  activityBorder: '#FFE073',
  activityButton: '#FFD241',
  star: '#F1BD24',
  starSoft: '#FFF5C9',
  dayNow: '#2EA99C',
  dayIdle: '#F1F1EE',
  previewBg: '#F1E7FA',
  previewInk: '#67497B',

  nameChipBg: '#E7E7E7',
  nameChipInk: '#7D7D7D',
  completeBg: '#E5EFEB',
  completeInk: '#44615A',
  shade: 'rgba(37, 67, 61, 0.3)',
  handle: '#DED7CE',
  splash: '#2D1B68',

  /** 부모·설정 */
  parentInk: '#3D332D',
  parentSoft: '#8C8078',
  parentMuted: '#958A82',
  parentLine: '#E9DDCB',
  parentSunken: '#F4EEE4',
  segmentBg: '#F2EDE4',
  settingsInk: '#443A34',
  settingsSoft: '#9B9188',
  settingsHeading: '#81776E',
  settingsIconBg: '#F2ECE3',
  settingsLine: '#EDE4D8',
  toggleOn: '#39B6A8',
  toggleOff: '#D8D2CA',
  streak: '#FF765D',
  calendarDone: '#43B37E',
  calendarToday: '#FF7058',
  danger: '#EE5745',
  footer: '#A59A90',
  white: '#FFFFFF',
} as const;

/** 루틴별 색. `c` 강조색, `p` 파스텔 바탕. 콘텐츠의 routine.tone 이 이 키를 가리킨다 */
export const tones = {
  morning: { c: '#F4BC16', p: '#FFF2A8', parent: '#FFD34D' },
  theme: { c: '#20AFA3', p: '#BFEFE7', parent: '#FF765D' },
  dinner: { c: '#F34E67', p: '#FFD0D7', parent: '#4DB584' },
  bedtime: { c: '#B64FE0', p: '#EBC5FA', parent: '#756BE3' },
  faithSong: { c: '#3F8FD6', p: '#CFE6FA', parent: '#3F8FD6' },
  faithStory: { c: '#8A6BD8', p: '#E2D8F8', parent: '#8A6BD8' },
} as const;

export type ToneName = keyof typeof tones;
export type Tone = (typeof tones)[ToneName];

/** 소리여행 단계 색 */
export const stageColors = ['#F1BE25', '#39B6A8', '#A85BD7', '#F05C72'] as const;

export const spacing = { xxs: 4, xs: 8, sm: 12, md: 16, lg: 20, xl: 24, xxl: 32 } as const;

export const radius = { sm: 10, md: 16, lg: 22, xl: 25, hero: 30, sheet: 32, pill: 999 } as const;

export const fonts = {
  /** 빙그레체 Bold: 큰 제목 전용 */
  display: 'BinggraeBold',
} as const;

export const sizes = {
  appMaxWidth: 430,
  screenPaddingX: 20,
  screenPaddingTop: 22,
  navHeight: 76,
  navInset: 12,
  navClearance: 110,
  heroHeight: 298,
  weekHeight: 170,
  sheetHeight: 600,
  playerTile: 125,
  button: 58,
  touch: 44,
} as const;

export const shadows = {
  nav: '0px 8px 28px rgba(45, 62, 56, 0.12)',
  stat: '0px 7px 18px rgba(72, 63, 55, 0.06)',
  frame: '0px 24px 70px rgba(37, 67, 61, 0.22)',
  character: '0px 7px 5px rgba(115, 86, 31, 0.15)',
} as const;

export const motion = { fast: 160, base: 240, float: 3200 } as const;

/** 시안의 글자 위계. 화면 글자는 이 중 하나를 쓴다 */
export const type = {
  eyebrow: { fontSize: 12, fontWeight: '700', letterSpacing: 1.1 },
  screenTitle: { fontSize: 31, lineHeight: 39, fontFamily: fonts.display, letterSpacing: -1.2 },
  greeting: { fontSize: 25, lineHeight: 32, fontFamily: fonts.display, letterSpacing: -1 },
  heroTitle: { fontSize: 28, lineHeight: 33, fontFamily: fonts.display, letterSpacing: -1.2 },
  weekTitle: { fontSize: 31, lineHeight: 38, fontFamily: fonts.display, letterSpacing: -1 },
  sectionTitle: { fontSize: 21, lineHeight: 27, fontWeight: '700', letterSpacing: -0.7 },
  sheetTitle: { fontSize: 25, lineHeight: 31, fontWeight: '700', letterSpacing: -0.8 },
  cardTitle: { fontSize: 18, lineHeight: 24, fontWeight: '700', letterSpacing: -0.6 },
  stat: { fontSize: 23, lineHeight: 29, fontWeight: '700', letterSpacing: -0.8 },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400' },
  bodyStrong: { fontSize: 15, lineHeight: 21, fontWeight: '700', letterSpacing: -0.4 },
  label: { fontSize: 13, lineHeight: 18, fontWeight: '700' },
  caption: { fontSize: 12, lineHeight: 17, fontWeight: '400' },
  captionStrong: { fontSize: 12, lineHeight: 17, fontWeight: '700' },
  micro: { fontSize: 11, lineHeight: 15, fontWeight: '700', letterSpacing: -0.2 },
  button: { fontSize: 17, lineHeight: 22, fontWeight: '700' },
  word: { fontSize: 34, lineHeight: 42, fontFamily: fonts.display },
} as const;

export type TypeVariant = keyof typeof type;
