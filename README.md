# 사운즈펀 브릿지 (SoundsFun Bridge)

아이가 매일 같은 시간에 영어 소리를 듣고, 들은 말을 찾고 말해 보는 루틴 앱. 이번 버전은 **Week 1 · Colors**.

- 웹 데모: https://lala-david.github.io/app/
- 기획 문서: `docs/html/00-지원서-분석.html`부터 (DOCX는 `docs/docx/`)
- 이전 버전(시안 도착 전)은 `legacy` 브랜치

## 무엇이 들어 있나

| 탭 | 내용 |
|---|---|
| 오늘 | 인사 카드, 오늘 진행, **번호가 붙은 루틴 길**, 루틴 시트(앱 안에서 영상 보기 · 듣기 시간 · 완료) |
| 소리여행 | 이번 주, 소리활동(단어 맞추기 → 단어 말하기), 48주 단계 |
| 부모 | 요약 네 칸, 오늘 · 주간 표 · 월간 달력, ‘들었어요’ 표시, 모은 스티커 |
| 설정 | 알림 시각, 저녁 리마인드, 하잉RTA 주말 콘텐츠, 아이 정보, 안내, 계정 |

| 순서 | 루틴 | 분 | 캐릭터 |
|---|---|---|---|
| 1 | 아침 노래 | 20 | 병아리 |
| 2 | 오늘의 주제 | 30 | 악어 |
| 3 | 저녁 노래 | 20 | 고양이 |
| 4 | 잠자리 이야기 | 20 | 토끼 |

## 폴더

```
sol/
├─ apps/
│  ├─ mobile/            Expo(React Native + Web) 앱 — 코드 한 벌, TypeScript
│  └─ api/               FastAPI + SQLAlchemy 서버 (테이블 16개, 제약으로 무결성 유지)
├─ packages/
│  └─ content-tools/     그림 변환 · 자산 목록 · 유즈케이스 다이어그램 생성
└─ docs/
   ├─ src/               기획 원본 (Markdown 12개)
   ├─ html/  docx/       생성된 문서
   ├─ assets/            다이어그램 PNG · UML · 실제 화면
   ├─ schema/            DDL (PostgreSQL · SQLite)
   ├─ week1-routine.txt  1주차 재생목록 정리
   ├─ build.py           src → html + docx
   └─ tools/             지원서 사본에 앱 화면 그림을 넣는 스크립트
```

이 PC에만 두고 저장소에는 올리지 않는 폴더:

| 폴더 | 내용 |
|---|---|
| `제출/` | 최종 지원서 docx, 폰에 까는 APK. `이전 버전/`에 원본 지원서와 앞선 판 |
| `design/` | 디자이너가 준 원본(SF 시안 SVG, 로고·캐릭터·영상, UI 디자인 zip) |
| `reference/` | 지원서 초안, 소리노출 가이드북, 소리루틴표 |
| `.env` | Recraft 키와 저장소 주소 |

## 앱 실행

```bash
cd apps/mobile
npm install
npm run web          # 브라우저에서
npm run web:demo     # 듣기 시간 60배속 (1분 = 1초) — 시연용
npm run android      # 개발 빌드 필요 (음성 인식 · 알림)
```

| 명령 | 설명 |
|---|---|
| `npm test` | 단위 테스트 40개 (Vitest) |
| `npm run typecheck` | 형 검사 |
| `EXPO_PUBLIC_BASE_URL=app npm run build:web` | GitHub Pages용 빌드 → `dist/` (슬래시 없이 `app`) |
| `npm run deploy:web` | `dist/`를 gh-pages 브랜치로 |

## 서버 실행

```bash
cd apps/api
python -m venv .venv && .venv/Scripts/pip install -r requirements.txt
.venv/Scripts/uvicorn app.main:app --reload     # http://localhost:8000/docs
.venv/Scripts/python -m pytest                  # API + DB 무결성 테스트 19개
.venv/Scripts/python -m scripts.export_schema   # docs/schema/*.sql 다시 만들기
```

환경 변수: `DATABASE_URL`, `JWT_SECRET`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `APP_TIMEZONE`, `CORS_ORIGINS`, `RUN_SCHEDULER`

이번 버전의 앱은 서버 없이 기기 저장으로 동작합니다. 서버는 따로 완성·테스트되어 있고, 연결할 때는 `entities/account`의 저장소 구현을 API용으로 바꾸고 기록 저장 뒤에 멱등 PUT을 보냅니다.

## 콘텐츠 바꾸기

| 바꿀 것 | 파일 |
|---|---|
| 루틴 · 영상 · 단어 · 문제 구성 | `apps/mobile/src/content/weeks/week1.json` |
| 목표 분 · 기본 알림 시각 · 연령 · 캐릭터 | `apps/mobile/src/content/app-config.json` |
| 화면 문구 | `apps/mobile/src/shared/i18n/strings.ko.ts` |
| 색 · 크기 · 글꼴 | `apps/mobile/src/shared/theme/tokens.ts` |

그림을 바꾼 뒤에는 `cd packages/content-tools && npm run registry`로 자산 목록을 다시 만듭니다. 주차를 더하려면 `week2.json`을 쓰고 `entities/content/content.ts`의 `WEEKS`에 등록합니다.

## 문서 다시 만들기

```bash
python docs/build.py                                   # 전체 (다이어그램 PNG 포함)
python docs/build.py 05                                # 05 데이터베이스 설계서만
python docs/tools/insert_app_figures.py <지원서.docx> <새 파일.docx>   # 지원서 사본에 앱 화면 넣기 (원본은 그대로)
node packages/content-tools/src/usecase-diagram.mjs    # 유즈케이스 다이어그램
```
