// 지원서에 넣을 화면 모음 그림을 만든다: 폰 틀에 넣은 화면 여러 장 + 번호·이름표
//   node src/build-application-figures.mjs <캡처 폴더> <알림 캡처 png>
import { mkdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(ROOT, '../../docs/assets/application');
const [shots, notificationShot] = process.argv.slice(2);

const FONT = 'Malgun Gothic, Apple SD Gothic Neo, sans-serif';
const INK = '#2C3E38';
const SOFT = '#6F7F79';
/** 화면 캡처는 2배 해상도라, 인쇄해도 또렷하게 1.6배로 그린다 */
const S = 1.6;
const PHONE = { w: Math.round(390 * S), h: Math.round(844 * S), bezel: Math.round(12 * S), radius: Math.round(46 * S) };
const GAP = Math.round(46 * S);
const PAD = Math.round(56 * S);
const LABEL = Math.round(96 * S);

const figures = [
  {
    file: 'fig-child.png',
    accent: '#F4BC16',
    phones: [
      { shot: 'today-path', title: '오늘의 루틴 길', note: '1 → 2 → 3 → 4 순서로' },
      { shot: 'sheet-theme', title: '앱 안에서 영상 보기', note: '재생되는 동안만 듣기 시간이 흐른다' },
      { shot: 'quiz', title: '단어 맞추기', note: '들은 말을 그림에서 찾기' },
      { shot: 'game-painted', title: '말하기 게임 ‘색깔 마법’', note: '말하면 그림에 색이 입혀진다' },
    ],
  },
  {
    file: 'fig-journey.png',
    accent: '#20AFA3',
    phones: [
      { shot: 'journey-top', title: '소리여행 · 이번 주', note: 'Week 1 Colors와 요일 기록' },
      { shot: 'journey-stages', title: '48주 단계', note: '12주씩 4단계, 주제별 구성' },
      { shot: 'game-sentence', title: '단어에서 문장으로', note: 'What color is it? — It’s red.' },
      { shot: 'game-finish', title: '작은 성취', note: '별 · 스티커 · 연속 기록' },
    ],
  },
  {
    file: 'fig-parent.png',
    accent: '#F34E67',
    phones: [
      { shot: 'parent-week', title: '보호자 · 주간 기록', note: '루틴표와 같은 모양으로 확인' },
      { shot: 'parent-insights', title: '어려워한 말 · 이번 주 대화', note: '생활 속 한마디 가이드' },
      { shot: notificationShot, absolute: true, crop: { top: 0.295, height: 0.26 }, title: '휴대폰 알림', note: '캐릭터가 정한 시각에 부른다' },
      { shot: 'settings', title: '설정', note: '알림 · 하잉RTA 선택 · 데이터 아끼기' },
    ],
  },
];

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

async function phoneImage(item) {
  const source = item.absolute ? item.shot : join(shots, `${item.shot}.png`);
  let image = sharp(source);
  if (item.crop) {
    // 알림은 화면 일부만 크게: 같은 폰 비율의 바탕 위에 올린다
    const meta = await image.metadata();
    const band = await image.extract({ left: 0, top: Math.round(meta.height * item.crop.top), width: meta.width, height: Math.round(meta.height * item.crop.height) }).resize({ width: PHONE.w - Math.round(28 * S) }).toBuffer();
    const bandHeight = (await sharp(band).metadata()).height;
    const wallpaper = Buffer.from(`<svg width="${PHONE.w}" height="${PHONE.h}" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#41236A"/><stop offset="1" stop-color="#683EA2"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/><text x="50%" y="${150 * S}" text-anchor="middle" font-family="${FONT}" font-size="${64 * S}" font-weight="700" fill="#fff">7:30</text><text x="50%" y="${192 * S}" text-anchor="middle" font-family="${FONT}" font-size="${18 * S}" fill="#E6DDF5">9월 21일 월요일</text></svg>`);
    const rounded = await sharp(band).composite([{ input: Buffer.from(`<svg width="${PHONE.w - Math.round(28 * S)}" height="${bandHeight}"><rect width="100%" height="100%" rx="${26 * S}" fill="#fff"/></svg>`), blend: 'dest-in' }]).png().toBuffer();
    return sharp(wallpaper).composite([{ input: rounded, left: Math.round(14 * S), top: Math.round(250 * S) }]).png().toBuffer();
  }
  return image.resize({ width: PHONE.w, height: PHONE.h, fit: 'cover', position: 'top' }).png().toBuffer();
}

async function framed(item) {
  const screen = await phoneImage(item);
  const inner = PHONE.radius - PHONE.bezel;
  const mask = Buffer.from(`<svg width="${PHONE.w}" height="${PHONE.h}"><rect width="100%" height="100%" rx="${inner}" fill="#fff"/></svg>`);
  const clipped = await sharp(screen).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();
  const W = PHONE.w + PHONE.bezel * 2;
  const H = PHONE.h + PHONE.bezel * 2;
  const body = Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg"><rect width="${W}" height="${H}" rx="${PHONE.radius}" fill="#1F2A27"/><rect x="3" y="3" width="${W - 6}" height="${H - 6}" rx="${PHONE.radius - 3}" fill="none" stroke="#3B4A45" stroke-width="2"/></svg>`);
  return sharp(body).composite([{ input: clipped, left: PHONE.bezel, top: PHONE.bezel }]).png().toBuffer();
}

await mkdir(OUT, { recursive: true });
for (const figure of figures) {
  const phoneW = PHONE.w + PHONE.bezel * 2;
  const phoneH = PHONE.h + PHONE.bezel * 2;
  const width = PAD * 2 + figure.phones.length * phoneW + (figure.phones.length - 1) * GAP;
  const height = PAD + phoneH + LABEL + PAD - Math.round(20 * S);
  const labels = figure.phones
    .map((phone, i) => {
      const y = PAD + phoneH + Math.round(44 * S);
      const x = PAD + i * (phoneW + GAP);
      return `<g><circle cx="${x + 26 * S}" cy="${y - 9 * S}" r="${17 * S}" fill="${figure.accent}"/><text x="${x + 26 * S}" y="${y - 2 * S}" text-anchor="middle" font-family="${FONT}" font-size="${20 * S}" font-weight="700" fill="#fff">${i + 1}</text><text x="${x + 52 * S}" y="${y - 1 * S}" font-family="${FONT}" font-size="${24 * S}" font-weight="700" fill="${INK}">${esc(phone.title)}</text><text x="${x + 10 * S}" y="${y + 34 * S}" font-family="${FONT}" font-size="${19 * S}" fill="${SOFT}">${esc(phone.note)}</text></g>`;
    })
    .join('');
  const background = Buffer.from(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" rx="${40 * S}" fill="#FAF8F5"/><rect x="1.5" y="1.5" width="${width - 3}" height="${height - 3}" rx="${40 * S - 1}" fill="none" stroke="#E8E3DC" stroke-width="3"/>${labels}</svg>`);
  const frames = await Promise.all(figure.phones.map(framed));
  await sharp(background)
    .composite(frames.map((input, i) => ({ input, left: PAD + i * (phoneW + GAP), top: PAD })))
    .png({ compressionLevel: 9, palette: true, quality: 92 })
    .toFile(join(OUT, figure.file));
  console.log('wrote', figure.file, width, 'x', height);
}
