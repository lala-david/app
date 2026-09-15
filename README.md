# 사운즈펀 브릿지 (SoundsFun Bridge)

아이가 하루 4번, 영어 소리에 놀듯이 노출되는 루틴 앱. MVP는 Week 1 ‘Colors’.

- 웹 데모: https://lala-david.github.io/app/
- 기획 문서: `docs/html/01-비전과-범위.html` (DOCX는 `docs/docx/`)

## 무엇이 들어 있나

| 루틴 | 시간 | 앱에서 |
|---|---|---|
| ☀ 아침송 | 20분 | 유튜브 링크 → 타이머 → 스티커 |
| 🎨 주제 집중듣기 | 30분 | 영상 → 단어 맞추기 → 단어 말하기 |
| 🍽 저녁송 | 20분 | 유튜브 링크 → 타이머 → 스티커 |
| 🌙 잠자리 스토리 | 20분 | 유튜브 링크 → 타이머 → 스티커 |

탭 3개: **홈**(코스 맵, 아이) · **부모**(대시보드, 부모 확인 필요) · **설정**(부모 확인 필요)

## 폴더

```
sol/
├─ apps/
│  ├─ mobile/            Expo(React Native) 앱 · 웹 — 코드 한 벌
│  └─ api/               FastAPI 백엔드 (서버 동기화·Web Push)
├─ packages/
│  └─ content-tools/     그림(Recraft)·음성(edge-tts)·효과음·등록 파일 생성
├─ docs/
│  ├─ src/               기획 원본 (Markdown)
│  ├─ html/  docx/       생성된 문서
│  ├─ assets/diagrams/   다이어그램 PNG
│  └─ build.py           src → html + docx
└─ reference/            원본 지원서·가이드북 (저장소에 올리지 않음)
```

## 앱 실행

```bash
cd apps/mobile
npm install
npm run web          # 브라우저에서 모바일 화면으로
npm run web:demo     # 듣기 타이머 60배속 (1분 = 1초) — 시연용
npm run android      # 개발 빌드 필요 (음성인식·알림)
```

| 명령 | 설명 |
|---|---|
| `npm test` | 단위 테스트 (Vitest) |
| `npm run typecheck` | 타입 검사 |
| `EXPO_PUBLIC_BASE_URL=app npm run build:web` | GitHub Pages용 빌드 → `dist/` (슬래시 없이 `app`) |
| `npm run deploy:web` | `dist/`를 gh-pages 브랜치로 배포 |

## 백엔드 실행

```bash
cd apps/api
python -m venv .venv && .venv/Scripts/pip install -r requirements.txt
.venv/Scripts/uvicorn app.main:app --reload     # http://localhost:8000/docs
.venv/Scripts/python -m pytest
```

환경 변수: `DATABASE_URL`, `JWT_SECRET`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `APP_TIMEZONE`, `CORS_ORIGINS`

MVP 앱은 서버 없이(기기 저장) 동작한다. 서버를 붙일 때는 `entities/account/api/accountRepository.ts`와 진행 기록 저장소를 원격 구현으로 바꾼다.

## 콘텐츠·에셋 다시 만들기

```bash
cd packages/content-tools
npm install
npm run images       # Recraft (루트 .env 의 RECRAFT_API_KEY)
npm run assets       # 아이콘 → WebP 변환 → 음성 → 효과음 → 등록 파일
npm run contact      # 그림 검수용 모아보기 (docs/assets/contact)
```

Week 추가: `apps/mobile/src/content/weeks/week2.json` 작성 → `entities/content/content.ts`의 `WEEKS`에 등록 → 새 단어는 `words.json`에 추가 후 `npm run images && npm run assets`.

## 문서 다시 만들기

```bash
python docs/build.py        # 전체
python docs/build.py 04     # 04 화면 명세서만
```
