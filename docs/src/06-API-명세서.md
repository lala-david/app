# API 명세서

FastAPI 서버(`apps/api`)의 HTTP API입니다. 서버를 띄우면 `/docs`에서 같은 내용을 직접 눌러 볼 수 있습니다.

| 항목 | 값 |
|---|---|
| 기본 주소 | `/api/v1` |
| 형식 | JSON, 필드는 camelCase |
| 인증 | `Authorization: Bearer <accessToken>` (JWT HS256, 15분). 갱신 토큰 30일 |
| 날짜 | `YYYY-MM-DD` (기기의 그날). 시각은 밀리초 숫자 |
| 비밀번호 | argon2 해시로만 저장 |

## 엔드포인트

| 메서드 | 경로 | 인증 | 설명 |
|---|---|---|---|
| POST | `/auth/signup` | – | 가입 → 토큰 |
| POST | `/auth/login` | – | 로그인 → 토큰 |
| POST | `/auth/refresh` | – | 토큰 갱신 |
| DELETE | `/me` | ○ | 탈퇴. 딸린 행 모두 삭제 |
| GET | `/children` | ○ | 내 아이 목록 |
| POST | `/children` | ○ | 아이 등록. 기본 알림 시각이 함께 생긴다 |
| PATCH | `/children/{id}` | ○ | 이름·연령·아바타·스위치 바꾸기 |
| PUT | `/children/{id}/schedule` | ○ | 알림 시각 전체 바꾸기 |
| GET | `/children/{id}/records?from=&to=` | ○ | 루틴 기록 조회 |
| PUT | `/children/{id}/records/{date}/{routine}` | ○ | 루틴 기록 올리기 (멱등) |
| POST | `/children/{id}/records/{date}/{routine}/parent-check` | ○ | ‘들었어요’ 표시·해제 |
| PUT | `/children/{id}/activities/{week}/{date}` | ○ | 소리활동 기록 올리기 (멱등) |
| GET | `/children/{id}/report?today=` | ○ | 부모 탭 요약 |
| GET | `/content/weeks/{week}` | – | 주차 콘텐츠 |
| GET | `/push/public-key` | – | Web Push 공개 키 |
| POST | `/push/subscriptions` | ○ | 알림 구독 등록 |
| DELETE | `/push/subscriptions` | ○ | 알림 구독 해지 |
| POST | `/push/test` | ○ | 시험 알림 |
| POST | `/events` | ○ | 사용 로그 묶음 |
| GET | `/health` | – | 상태 확인 (접두사 없음) |

## 계정

```json
POST /api/v1/auth/signup
{ "email": "parent@example.com", "password": "********", "consentVersion": "2026-09-19", "notifyConsent": true }

201
{ "accessToken": "…", "refreshToken": "…", "userId": "6b1f…" }
```

| 상태 | detail | 언제 |
|---|---|---|
| 409 | `duplicate_email` | 이미 가입한 이메일 (대소문자 무시) |
| 401 | `wrong_credentials` | 로그인 실패 |
| 422 | – | 이메일 형식, 비밀번호 8자 미만 |

## 아이

```json
POST /api/v1/children
{ "nickname": "하이", "ageBand": "7", "avatar": { "kind": "character", "character": "chick" }, "startDate": "2026-09-21" }

201
{
  "id": "c0a8…", "nickname": "하이", "ageBand": "7",
  "avatar": { "kind": "character", "character": "chick" },
  "startDate": "2026-09-21", "run": 1, "runStartDate": "2026-09-21",
  "faithEnabled": false, "notificationsEnabled": true, "eveningReminder": true,
  "schedules": [ { "routine": "morning", "time": "07:30", "enabled": true }, … ]
}
```

- 사진을 쓰면 `{ "kind": "photo" }`만 보냅니다. 사진 자체는 서버에 오지 않습니다.
- `kind`가 `character`인데 `character`가 없거나 없는 캐릭터면 422 (`unknown_character`).
- 알림 시각: `time`은 `HH:MM`, 같은 루틴이 두 번 오거나 없는 루틴이면 422.

## 루틴 기록

```json
PUT /api/v1/children/{id}/records/2026-09-21/morning
{ "runningSince": null, "accumulatedSec": 1200, "listenedMin": 20, "completion": "timer", "completedAt": 1790000000000 }

200
{ "date": "2026-09-21", "routine": "morning", "runningSince": null, "accumulatedSec": 1200, "listenedMin": 20, "completion": "timer", "completedAt": 1790000000000 }
```

| 규칙 | 설명 |
|---|---|
| 멱등 | (아이, 날짜, 루틴)당 한 줄. 같은 요청을 다시 보내도 같다 |
| 줄어들지 않는다 | `accumulatedSec`, `listenedMin`은 큰 값을 남긴다. 늦게 도착한 옛 요청이 기록을 깎지 못한다 |
| 완료는 되돌리지 않는다 | 이미 완료된 기록에 미완료 요청이 와도 완료가 남는다 |
| 짝 | `completion`과 `completedAt`은 함께 있어야 한다. 아니면 422 |
| 없는 루틴 | 404 `routine_not_found` |

### ‘들었어요’ 표시

```json
POST /api/v1/children/{id}/records/2026-09-20/dinner/parent-check
{ "checked": true }
```

| 경우 | 결과 |
|---|---|
| 표시 | `completion: "parent"`, 목표 분이 기록된다 |
| 해제 (부모 표시였던 칸) | 기록을 지우고 `null` |
| 해제 (앱에서 완료한 칸) | 409 `app_record_locked` |
| 미래 날짜 | 422 `future_date` |

## 소리활동

```json
PUT /api/v1/children/{id}/activities/1/2026-09-21
{
  "quiz": [
    { "questionId": "q1", "type": "pickImage", "word": "red", "correct": true, "ms": 900 },
    { "questionId": "q6", "type": "match", "correct": false }
  ],
  "speak": [ { "word": "red", "heard": "red", "score": 1.0, "result": "pass" } ],
  "stars": 2,
  "completedAt": 1790000000000
}
```

- 그날의 활동 한 줄을 통째로 바꿉니다. 답과 시도는 지우고 다시 넣습니다.
- 없는 단어는 422 `unknown_word:<id>`. 짝 맞추기만 `word`가 없어야 하고, 나머지는 있어야 합니다(422 `word_must_match_question_type`).

## 부모 탭 요약

```json
GET /api/v1/children/{id}/report?today=2026-09-22

{
  "todayMinutes": 30, "todayTarget": 90, "streak": 2,
  "weekDone": 2, "weekTotal": 28, "totalMinutes": 50,
  "routineRates": [ { "routine": "morning", "done": 1, "total": 2 }, … ],
  "stickers": [ "chick", "crocodile" ]
}
```

계산 규칙은 앱의 `features/parent/model/report.ts`와 같습니다. 연속일은 오늘 한 게 없으면 어제부터 셉니다.

## 주차 콘텐츠

`GET /content/weeks/1`은 정규화된 테이블(`weeks`, `week_routines`, `routines`, `week_words`, `week_sentences`)을 앱의 `week1.json`과 같은 모양으로 묶어 돌려줍니다.

## 알림

1. 앱이 `GET /push/public-key`로 키를 받고 브라우저에서 구독을 만든다.
2. `POST /push/subscriptions`로 등록한다. `endpoint`는 유일하다.
3. 서버는 매분 `routine_schedules`를 보고, 끝내지 않은 루틴에만 보낸다. 누르면 `/today?open=<routine>`이 열린다.
4. 브라우저가 구독을 버렸으면(404·410) 그 줄을 지운다.

## 권한과 오류

| 상태 | 뜻 |
|---|---|
| 401 | 토큰이 없거나 만료 |
| 404 `child_not_found` | 없는 아이, 또는 **남의 아이** (있는지 없는지도 알려 주지 않는다) |
| 409 | 중복 가입, 잠긴 기록 |
| 422 | 값 검사 실패 |

## 동기화 방식

**이번 버전의 앱은 아직 서버를 부르지 않습니다.** 기기 저장이 원본이고, 서버는 파일럿에서 여러 기기·기관 통계가 필요할 때 연결합니다. 연결하면 기록이 바뀔 때마다 위의 멱등 PUT을 보내고, 실패하면 다음에 다시 보냅니다. 서버는 큰 값·완료 우선 규칙으로 합치므로 순서가 바뀌거나 두 번 와도 결과가 같습니다.

## 실행

```bash
cd apps/api
python -m venv .venv && .venv/Scripts/pip install -r requirements.txt
.venv/Scripts/uvicorn app.main:app --reload        # http://localhost:8000/docs
.venv/Scripts/python -m pytest                      # 19개 테스트
.venv/Scripts/python -m scripts.export_schema       # docs/schema/*.sql 다시 만들기
```

| 환경 변수 | 기본 | 설명 |
|---|---|---|
| DATABASE_URL | `sqlite:///apps/api/soundsfun.db` | 운영은 PostgreSQL 주소 |
| JWT_SECRET | 개발용 값 | 운영에서는 꼭 바꾼다 |
| APP_TIMEZONE | Asia/Seoul | 알림 시각 기준 |
| CORS_ORIGINS | localhost, GitHub Pages | 허용할 앱 주소 |
| VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY | 없음 | 없으면 알림 발송을 건너뛴다 |
| RUN_SCHEDULER | 1 | 0이면 매분 알림 작업을 끈다 |
