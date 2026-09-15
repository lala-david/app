/**
 * 디자인 토큰. 색·크기·글꼴은 여기서만 정의한다.
 * UI/UX 디자인이 확정되면 이 파일의 값만 바꾼다.
 */

const palette = {
  cream: '#FFF8EA',
  paper: '#F7F4EE',
  white: '#FFFFFF',
  cocoa: '#3B2F2A',
  cocoaSoft: '#6B5D55',
  cocoaMuted: '#9A8C83',
  sand: '#EDE4D6',
  sandDeep: '#E2D6C3',
  coral: '#FF7A59',
  coralDark: '#E0603F',
  coralSoft: '#FFE6DD',
  leaf: '#4CAF7A',
  leafDark: '#3A8F62',
  leafSoft: '#E0F3E7',
  sun: '#FFC53D',
  sunDark: '#E5A814',
  flame: '#FF8A3D',
  stone: '#DCD5CA',
  stoneDark: '#C2B8AB',
  red: '#E0533D',
  redSoft: '#FDE7E2',
} as const;

export const colors = {
  bgChild: palette.cream,
  bgParent: palette.paper,
  surface: palette.white,
  surfaceSunken: '#F6F0E6',
  text: palette.cocoa,
  textSoft: palette.cocoaSoft,
  textMuted: palette.cocoaMuted,
  textOnAccent: palette.white,
  line: palette.sand,
  lineStrong: palette.sandDeep,
  primary: palette.coral,
  primaryDark: palette.coralDark,
  primarySoft: palette.coralSoft,
  success: palette.leaf,
  successDark: palette.leafDark,
  successSoft: palette.leafSoft,
  star: palette.sun,
  starDark: palette.sunDark,
  flame: palette.flame,
  locked: palette.stone,
  lockedDark: palette.stoneDark,
  danger: palette.red,
  dangerSoft: palette.redSoft,
  overlay: 'rgba(59, 47, 42, 0.48)',
  frameBackdrop: '#EFE7DA',
} as const;

/** 루틴마다 시간대 색. 콘텐츠 JSON의 routine.tone이 이 키를 가리킨다. */
export const tones = {
  sun: { base: '#FFD449', dark: '#E3B321', soft: '#FFF4C7', ink: '#6B4E00' },
  coral: { base: '#FF7A59', dark: '#E0603F', soft: '#FFE6DD', ink: '#FFFFFF' },
  leaf: { base: '#6BB37A', dark: '#4F9560', soft: '#E3F2E6', ink: '#FFFFFF' },
  night: { base: '#6C6FD4', dark: '#5053B4', soft: '#E6E7FA', ink: '#FFFFFF' },
  sky: { base: '#7CC4F5', dark: '#58A5DA', soft: '#E2F2FD', ink: '#0F4A73' },
  lilac: { base: '#B08BE0', dark: '#8F6BC4', soft: '#F1E8FB', ink: '#FFFFFF' },
} as const;

export type ToneName = keyof typeof tones;
export type Tone = (typeof tones)[ToneName];

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 30,
  pill: 999,
} as const;

export const fonts = {
  display: 'Jua_400Regular',
  body: undefined,
} as const;

export const type = {
  hero: { fontSize: 34, lineHeight: 42, fontFamily: fonts.display },
  childTitle: { fontSize: 28, lineHeight: 36, fontFamily: fonts.display },
  childWord: { fontSize: 36, lineHeight: 44, fontFamily: fonts.display },
  childBody: { fontSize: 20, lineHeight: 28, fontFamily: fonts.display },
  number: { fontSize: 30, lineHeight: 36, fontFamily: fonts.display },
  title: { fontSize: 22, lineHeight: 30, fontWeight: '700' },
  heading: { fontSize: 18, lineHeight: 26, fontWeight: '700' },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' },
  bodyStrong: { fontSize: 16, lineHeight: 24, fontWeight: '600' },
  caption: { fontSize: 14, lineHeight: 20, fontWeight: '400' },
  micro: { fontSize: 12, lineHeight: 16, fontWeight: '600' },
} as const;

export type TypeVariant = keyof typeof type;

export const sizes = {
  touch: 56,
  buttonChild: 64,
  buttonParent: 54,
  buttonDepth: 4,
  node: 78,
  nodeRing: 96,
  avatarSm: 42,
  avatarMd: 64,
  avatarLg: 128,
  tabBar: 68,
  appMaxWidth: 440,
  sheetHandle: 44,
  mic: 108,
  timer: 232,
} as const;

export const shadows = {
  card: '0px 2px 12px rgba(59, 47, 42, 0.08)',
  raised: '0px 6px 24px rgba(59, 47, 42, 0.14)',
  frame: '0px 20px 60px rgba(59, 47, 42, 0.18)',
} as const;

export const motion = {
  fast: 150,
  base: 250,
  slow: 500,
  float: 1600,
} as const;
