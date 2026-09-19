// UML 유즈케이스 다이어그램을 SVG로 그려 PNG로 저장한다: node packages/content-tools/src/usecase-diagram.mjs
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const OUT_DIR = path.join(ROOT, 'docs/assets/uml');
const W = 1800;
const H = 1420;
const FONT = 'Malgun Gothic, Apple SD Gothic Neo, sans-serif';
const INK = '#2B2A33';

const tone = {
  today: { fill: '#FFF2A8', stroke: '#E0A800', panel: '#FFFBE6' },
  journey: { fill: '#BFEFE7', stroke: '#20AFA3', panel: '#F0FBF9' },
  parent: { fill: '#FFD0D7', stroke: '#F34E67', panel: '#FFF4F6' },
  settings: { fill: '#EBC5FA', stroke: '#B64FE0', panel: '#FAF1FE' },
  shared: { fill: '#FFFFFF', stroke: '#8A879C', panel: '#FFFFFF' },
};

const COL = { child: 560, shared: 890, parent: 1255 };
const panels = [
  { tone: 'today', label: '오늘', x: 370, y: 130, w: 670, h: 420 },
  { tone: 'journey', label: '소리여행 · 소리활동', x: 370, y: 580, w: 670, h: 420 },
  { tone: 'shared', label: '시작', x: 370, y: 1030, w: 670, h: 170 },
  { tone: 'parent', label: '부모', x: 1070, y: 130, w: 370, h: 420 },
  { tone: 'settings', label: '계정 · 설정', x: 1070, y: 580, w: 370, h: 760 },
];

const cases = [
  { id: 'UC-02', name: '오늘의 루틴 길 보기', tone: 'today', x: COL.child, y: 230 },
  { id: 'UC-03', name: '소리 놀이 시작하기', tone: 'today', x: COL.child, y: 350 },
  { id: 'UC-04', name: '루틴 완료하기', tone: 'today', x: COL.child, y: 470 },
  { id: 'inc-timer', name: '듣기 시간 재기', tone: 'shared', x: COL.shared, y: 290, small: true },
  { id: 'inc-reward', name: '스티커·연속일 쌓기', tone: 'shared', x: COL.shared, y: 470, small: true },
  { id: 'UC-05', name: '단어 맞추기', tone: 'journey', x: COL.child, y: 680 },
  { id: 'UC-06', name: '단어 말하기', tone: 'journey', x: COL.child, y: 800 },
  { id: 'UC-07', name: '48주 여정 보기', tone: 'journey', x: COL.child, y: 920 },
  { id: 'inc-star', name: '별 받기', tone: 'shared', x: COL.shared, y: 740, small: true },
  { id: 'UC-01', name: '시작 영상 보고 들어가기', tone: 'shared', x: COL.child, y: 1125 },
  { id: 'UC-08', name: '기록 보기 (오늘·주간·월간)', tone: 'parent', x: COL.parent, y: 230 },
  { id: 'UC-09', name: '‘들었어요’ 표시·해제', tone: 'parent', x: COL.parent, y: 350 },
  { id: 'UC-10', name: '모은 스티커 보기', tone: 'parent', x: COL.parent, y: 470 },
  { id: 'UC-11', name: '가입 · 로그인', tone: 'settings', x: COL.parent, y: 680 },
  { id: 'UC-12', name: '아이 등록 · 친구/사진 고르기', tone: 'settings', x: COL.parent, y: 800 },
  { id: 'UC-13', name: '알림 시간 정하기', tone: 'settings', x: COL.parent, y: 920 },
  { id: 'UC-14', name: '하잉RTA 주말 콘텐츠 켜기', tone: 'settings', x: COL.parent, y: 1040 },
  { id: 'UC-15', name: '루틴 알림 받기', tone: 'settings', x: COL.parent, y: 1160 },
  { id: 'UC-16', name: '탈퇴하기', tone: 'settings', x: COL.parent, y: 1275 },
];

const actors = [
  { id: 'child', name: '아이', note: '6–10세 · 주 사용자', x: 160, y: 640, color: '#E0A800', person: true, side: 'left' },
  { id: 'youtube', name: 'YouTube', note: '«외부 시스템»', x: 160, y: 250, color: '#F34E67', side: 'left' },
  { id: 'speech', name: '음성 인식', note: '«기기 기능»', x: 160, y: 1040, color: '#20AFA3', side: 'left' },
  { id: 'parent', name: '부모', note: '보호자 · 계정 주인', x: 1640, y: 700, color: '#F34E67', person: true, side: 'right' },
  { id: 'push', name: '알림 서비스', note: '«OS · Web Push»', x: 1640, y: 1240, color: '#B64FE0', side: 'right' },
];

const links = [
  ['child', 'UC-02'], ['child', 'UC-03'], ['child', 'UC-04'], ['child', 'UC-05'], ['child', 'UC-06'], ['child', 'UC-07'], ['child', 'UC-01'],
  ['youtube', 'UC-03'], ['speech', 'UC-06'],
  ['parent', 'UC-08'], ['parent', 'UC-09'], ['parent', 'UC-10'], ['parent', 'UC-11'], ['parent', 'UC-12'], ['parent', 'UC-13'], ['parent', 'UC-14'], ['parent', 'UC-15'], ['parent', 'UC-16'],
  ['push', 'UC-15'],
];

const includes = [
  ['UC-03', 'inc-timer', 'include'], ['UC-04', 'inc-reward', 'include'], ['UC-05', 'inc-star', 'include'], ['UC-06', 'inc-star', 'include'],
  ['inc-timer', 'UC-04', 'extend'],
];

const rx = (c) => (c.small ? 118 : c.x === COL.parent ? 168 : 158);
const ry = (c) => (c.small ? 36 : 44);
const byId = Object.fromEntries(cases.map((c) => [c.id, c]));
const actorById = Object.fromEntries(actors.map((a) => [a.id, a]));

/** 타원 중심에서 (tx,ty) 쪽으로 나가는 테두리 위의 점 */
function edge(c, tx, ty) {
  const dx = tx - c.x;
  const dy = ty - c.y;
  const k = 1 / Math.sqrt((dx * dx) / rx(c) ** 2 + (dy * dy) / ry(c) ** 2);
  return [c.x + dx * k, c.y + dy * k];
}

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

function drawActor(a) {
  const label = `<text x="${a.x}" y="${a.y + 78}" text-anchor="middle" font-size="22" font-weight="700" fill="${INK}">${esc(a.name)}</text><text x="${a.x}" y="${a.y + 104}" text-anchor="middle" font-size="15" fill="#6B6880">${esc(a.note)}</text>`;
  if (!a.person) {
    return `<rect x="${a.x - 62}" y="${a.y - 38}" width="124" height="84" rx="18" fill="#fff" stroke="${a.color}" stroke-width="4"/><circle cx="${a.x}" cy="${a.y + 4}" r="20" fill="${a.color}" opacity=".18"/><path d="M${a.x - 7} ${a.y - 6} L${a.x + 10} ${a.y + 4} L${a.x - 7} ${a.y + 14} Z" fill="${a.color}"/>${label}`;
  }
  return `<g stroke="${a.color}" stroke-width="5" stroke-linecap="round" fill="none"><circle cx="${a.x}" cy="${a.y - 42}" r="19" fill="#fff"/><path d="M${a.x} ${a.y - 23} V${a.y + 18} M${a.x - 30} ${a.y - 6} H${a.x + 30} M${a.x} ${a.y + 18} L${a.x - 24} ${a.y + 52} M${a.x} ${a.y + 18} L${a.x + 24} ${a.y + 52}"/></g>${label}`;
}

function drawCase(c) {
  const t = tone[c.tone];
  const isUc = c.id.startsWith('UC-');
  const id = isUc ? `<text x="${c.x}" y="${c.y - 9}" text-anchor="middle" font-size="13" font-weight="700" fill="${t.stroke}" letter-spacing="1">${c.id}</text>` : '';
  return `<ellipse cx="${c.x}" cy="${c.y + 4}" rx="${rx(c)}" ry="${ry(c)}" fill="#1B1A2A" opacity=".08"/><ellipse cx="${c.x}" cy="${c.y}" rx="${rx(c)}" ry="${ry(c)}" fill="${t.fill}" stroke="${t.stroke}" stroke-width="3"/>${id}<text x="${c.x}" y="${c.y + (isUc ? 15 : 7)}" text-anchor="middle" font-size="${c.small ? 17 : 19}" font-weight="700" fill="${INK}">${esc(c.name)}</text>`;
}

function drawLink([actorId, caseId]) {
  const a = actorById[actorId];
  const c = byId[caseId];
  const ax = a.side === 'left' ? a.x + 66 : a.x - 66;
  // 옆 끝점에 붙여야 선이 다른 타원 뒤로 지나가지 않는다
  const [ex, ey] = [a.side === 'left' ? c.x - rx(c) : c.x + rx(c), c.y];
  return `<line x1="${ax}" y1="${a.y}" x2="${ex.toFixed(1)}" y2="${ey.toFixed(1)}" stroke="${a.color}" stroke-width="2.5" opacity=".75"/>`;
}

function drawInclude([fromId, toId, kind]) {
  const from = byId[fromId];
  const to = byId[toId];
  const [x1, y1] = edge(from, to.x, to.y);
  const [x2, y2] = edge(to, from.x, from.y);
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#6B6880" stroke-width="2" stroke-dasharray="7 6" marker-end="url(#arrow)"/><rect x="${mx - 46}" y="${my - 13}" width="92" height="22" rx="11" fill="#fff" opacity=".92"/><text x="${mx}" y="${my + 4}" text-anchor="middle" font-size="13" fill="#4A4860">«${kind}»</text>`;
}

const panelSvg = panels
  .map((p) => {
    const t = tone[p.tone];
    const dash = p.tone === 'shared' ? '6 6' : '0';
    return `<rect x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" rx="24" fill="${t.panel}" stroke="${t.stroke}" stroke-width="1.5" stroke-dasharray="${dash}"/><text x="${p.x + 22}" y="${p.y + 34}" font-size="17" font-weight="700" fill="${t.stroke}">${esc(p.label)}</text>`;
  })
  .join('\n');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="${FONT}">
<defs><marker id="arrow" viewBox="0 0 12 12" refX="10" refY="6" markerWidth="11" markerHeight="11" orient="auto"><path d="M1 1 L11 6 L1 11" fill="none" stroke="#6B6880" stroke-width="1.8"/></marker></defs>
<rect width="${W}" height="${H}" fill="#FFFFFF"/>
<rect x="340" y="50" width="1130" height="${H - 90}" rx="34" fill="#FFFDF6" stroke="#F4BC16" stroke-width="4"/>
<text x="905" y="98" text-anchor="middle" font-size="27" font-weight="700" fill="${INK}">SoundsFun Bridge · Week 1 MVP</text>
${panelSvg}
${links.map(drawLink).join('\n')}
${includes.map(drawInclude).join('\n')}
${cases.map(drawCase).join('\n')}
${actors.map(drawActor).join('\n')}
</svg>`;

await mkdir(OUT_DIR, { recursive: true });
await writeFile(path.join(OUT_DIR, 'usecase.svg'), svg, 'utf8');
await sharp(Buffer.from(svg), { density: 144 }).png().toFile(path.join(OUT_DIR, 'usecase.png'));
console.log('wrote docs/assets/uml/usecase.png');
