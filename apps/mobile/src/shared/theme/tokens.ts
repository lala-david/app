/**
 * 디자인 토큰. 값은 디자인 시안(SF/*.svg)과 디자이너 라이브 사이트의 CSS에서 가져왔다.
 * 색·크기·글꼴은 여기서만 정의한다.
 */

export const colors = {
  /** 아이 화면(오늘·소리여행) */
  ground: '#FAF8F5',
  /** 부모·설정 화면 */
  groundParent: '#F8F4EC',
  groundSettings: '#F7F3EC',
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

  hero: '#FFD84E',
  heroBubble: '#FFEFA3',
  heroBlob: '#FFF4BD',
  heroBadge: '#FFF8D5',
  heroSub: '#71807A',
  week: '#FFD94F',
  weekLabel: '#5B4B12',
  activityLabel: '#8C7B38',
  activityButtonInk: '#55430C',
  daysBorder: '#ECE6DF',
  dayLabel: '#7B8984',
  stageBorder: '#E8E5DF',
  stageNowBg: '#FFF8D9',
  stageNowChip: '#FFF4B7',
  stageWeeks: '#7A8984',
  stageThemes: '#33453F',
  stageNote: '#72817B',
  dayPillIdle: '#EEE8DF',
  dayPillIdleInk: '#897E75',
  dayDate: '#52655F',
  doneCount: '#668078',
  sheetGuide: '#6E7A76',
  sheetTimer: '#687772',
  previewLabel: '#8B69A4',
  previewQuestion: '#3D3451',
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
  splashTop: '#412369',
  splashBottom: '#683EA2',

  /** 부모·설정 */
  parentInk: '#3D332D',
  parentSoft: '#8C8078',
  parentMuted: '#958A82',
  parentLine: '#E9DDCB',
  parentSunken: '#F4EEE4',
  segmentBg: '#F2EDE4',
  settingsInk: '#433932',
  settingsSoft: '#93877D',
  settingsIcon: '#7F746B',
  settingsHeading: '#81776E',
  settingsIconBg: '#F2ECE3',
  settingsLine: '#EDE4D8',
  toggleOn: '#A7D7D1',
  toggleOff: '#D8D2CA',
  streak: '#FF765D',
  calendarDone: '#4DB584',
  calendarToday: '#FF765D',
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
  /** 시안의 본문 글꼴 Pretendard. 굵기마다 글꼴 파일이 달라 fontWeight 대신 이 이름을 쓴다 */
  regular: 'Pretendard-Regular',
  bold: 'Pretendard-Bold',
  heavy: 'Pretendard-ExtraBold',
} as const;

export const sizes = {
  appMaxWidth: 430,
  screenPaddingX: 20,
  parentPaddingX: 16,
  screenPaddingTop: 20,
  navHeight: 76,
  navInset: 12,
  navClearance: 110,
  heroHeight: 298,
  weekHeight: 170,
  sheetHeight: 599,
  playerTile: 125,
  /** 디자이너 원본 그림에는 둘레 여백이 있다. 상자 대비 캐릭터 크기 */
  characterFill: 0.88,
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

/** 시안(SF/*.svg)의 글자에서 역산한 위계. 화면 글자는 이 중 하나를 쓴다 */
export const type = {
  eyebrow: { fontSize: 11, lineHeight: 14, fontFamily: fonts.heavy, letterSpacing: 0.2 },
  greeting: { fontSize: 23, lineHeight: 30, fontFamily: fonts.display, letterSpacing: 0.2 },
  screenTitle: { fontSize: 29, lineHeight: 37, fontFamily: fonts.display },
  pageTitle: { fontSize: 26, lineHeight: 33, fontFamily: fonts.display },
  parentTitle: { fontSize: 23, lineHeight: 29, fontFamily: fonts.bold },
  heroTitle: { fontSize: 28, lineHeight: 33, fontFamily: fonts.display, letterSpacing: -1.1 },
  weekTitle: { fontSize: 32, lineHeight: 38, fontFamily: fonts.bold },
  sectionTitle: { fontSize: 22, lineHeight: 27, fontFamily: fonts.bold },
  sheetTitle: { fontSize: 26, lineHeight: 32, fontFamily: fonts.bold },
  cardTitle: { fontSize: 19, lineHeight: 24, fontFamily: fonts.heavy },
  parentCardTitle: { fontSize: 19, lineHeight: 24, fontFamily: fonts.bold },
  stat: { fontSize: 23, lineHeight: 28, fontFamily: fonts.bold },
  body: { fontSize: 15, lineHeight: 22, fontFamily: fonts.regular },
  bodyStrong: { fontSize: 15, lineHeight: 21, fontFamily: fonts.bold },
  rowTitle: { fontSize: 15, lineHeight: 20, fontFamily: fonts.bold },
  label: { fontSize: 13, lineHeight: 18, fontFamily: fonts.bold },
  labelSoft: { fontSize: 13, lineHeight: 18, fontFamily: fonts.regular },
  caption: { fontSize: 12, lineHeight: 17, fontFamily: fonts.regular },
  captionStrong: { fontSize: 12, lineHeight: 17, fontFamily: fonts.heavy },
  small: { fontSize: 11, lineHeight: 15, fontFamily: fonts.regular },
  smallStrong: { fontSize: 11, lineHeight: 15, fontFamily: fonts.heavy },
  activityTitle: { fontSize: 17, lineHeight: 22, fontFamily: fonts.bold },
  stageName: { fontSize: 15, lineHeight: 20, fontFamily: fonts.heavy },
  dayCount: { fontSize: 14, lineHeight: 18, fontFamily: fonts.bold },
  captionButton: { fontSize: 13, lineHeight: 18, fontFamily: fonts.heavy },
  segment: { fontSize: 14, lineHeight: 18, fontFamily: fonts.bold },
  gridHead: { fontSize: 10, lineHeight: 11, fontFamily: fonts.heavy },
  guide: { fontSize: 12, lineHeight: 15, fontFamily: fonts.regular },
  tiny: { fontSize: 9, lineHeight: 12, fontFamily: fonts.heavy },
  micro: { fontSize: 10, lineHeight: 13, fontFamily: fonts.heavy },
  microSoft: { fontSize: 10, lineHeight: 14, fontFamily: fonts.regular },
  button: { fontSize: 17, lineHeight: 22, fontFamily: fonts.heavy },
  buttonSoft: { fontSize: 16, lineHeight: 22, fontFamily: fonts.bold },
  word: { fontSize: 34, lineHeight: 42, fontFamily: fonts.display },
} as const;

export type TypeVariant = keyof typeof type;
