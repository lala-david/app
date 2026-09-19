# 설계 모델 (UML)

유즈케이스 다이어그램은 03 문서에, ERD는 05 문서에 있습니다. 여기에는 클래스·시퀀스·상태·컴포넌트·배치 다이어그램을 모았습니다.

## 1. 클래스 다이어그램 — 도메인 모델

앱(`entities/`)과 서버(`models.py`)가 함께 쓰는 개념입니다. 계산은 모두 순수 함수로 두어 화면 없이 테스트합니다.

```mermaid
classDiagram
  direction LR
  class User {
    +id: UUID
    +email: string
    +consentVersion: string
    +notifyConsent: boolean
  }
  class Child {
    +id: UUID
    +nickname: string
    +ageBand: AgeBand
    +avatar: Avatar
    +startDate: DateKey
    +run: int
    +runStartDate: DateKey
    +faithEnabled: boolean
    +notificationsEnabled: boolean
    +eveningReminder: boolean
  }
  class Avatar {
    <<union>>
    kind: character | photo
    character?: CharacterKey
    dataUri?: string
  }
  class RoutineSchedule {
    +routine: RoutineKey
    +time: HH:MM
    +enabled: boolean
  }
  class Week {
    +week: int
    +theme: string
    +days: int
    +playlistId: string
  }
  class Routine {
    +key: RoutineKey
    +order: int
    +title: string
    +targetMinutes: int
    +tone: Tone
    +character: CharacterKey
    +requiresFaith: boolean
  }
  class WeekRoutine {
    +guide: string
    +sentence: string
    +video: VideoRef
  }
  class Word {
    +id: string
    +ko: string
    +group: WordGroup
  }
  class RoutineRecord {
    +date: DateKey
    +routine: RoutineKey
    +runningSince: ms?
    +accumulatedSec: int
    +listenedMin: int
    +completion: timer | manual | parent
    +completedAt: ms?
    +elapsedSec(now) int
    +isDone() boolean
  }
  class ActivityRecord {
    +week: int
    +date: DateKey
    +stars: int
    +completedAt: ms?
  }
  class QuizAnswer {
    +questionId: string
    +type: QuestionType
    +word?: string
    +correct: boolean
    +ms: int
  }
  class SpeakAttempt {
    +word: string
    +heard: string
    +score: 0..1
    +result: SpeakResult
  }
  class TodayState {
    <<computed>>
    +days: PathDay[]
    +done: int
    +total: int
    +minutes: int
    +percent: int
    +streak: int
  }
  class ParentReport {
    <<computed>>
    +summaryStats()
    +weekTable()
    +monthView()
    +weekGlance()
    +stickerBoard()
  }

  User "1" *-- "0..*" Child
  Child *-- "1" Avatar
  Child "1" *-- "0..*" RoutineSchedule
  Child "1" *-- "0..*" RoutineRecord
  Child "1" *-- "0..*" ActivityRecord
  ActivityRecord "1" *-- "0..*" QuizAnswer
  ActivityRecord "1" *-- "0..*" SpeakAttempt
  Week "1" *-- "4..6" WeekRoutine
  WeekRoutine "0..*" --> "1" Routine
  Week "1" o-- "0..*" Word
  RoutineRecord "0..*" --> "1" Routine
  RoutineSchedule "0..*" --> "1" Routine
  QuizAnswer "0..*" --> "0..1" Word
  SpeakAttempt "0..*" --> "1" Word
  TodayState ..> Week : reads
  TodayState ..> RoutineRecord : reads
  ParentReport ..> RoutineRecord : reads
  ParentReport ..> Child : reads
```

## 2. 클래스 다이어그램 — 앱의 층

```mermaid
classDiagram
  direction TB
  class TodayScreen {
    <<screen>>
  }
  class RoutinePath {
    <<ui>>
    +days: PathDay[]
    +onOpen(routine)
  }
  class RoutineSheet {
    <<ui>>
    +routine: RoutineDef
    +start()
    +pause()
    +complete()
  }
  class useTodayState {
    <<hook>>
  }
  class useRoutineTimer {
    <<hook>>
    +elapsedSec
    +running
  }
  class computeTodayState {
    <<pure>>
  }
  class layoutPath {
    <<pure>>
    +stations: Point[]
    +segments: Curve[]
  }
  class progressStore {
    <<zustand + persist>>
    +routines: Map
    +activities: Map
  }
  class progressActions {
    <<actions>>
    +startTimer()
    +pauseTimer()
    +complete(kind)
    +clearParentCheck()
    +addQuizAnswer()
    +addSpeakAttempt()
  }
  class childStore {
    <<zustand + persist>>
  }
  class content {
    <<json>>
    week1 · journey · app-config · words
  }
  class platform {
    <<adapter .web / .native>>
    openExternal(youtubeUrl)
    speech
    notifications
    storage
  }

  TodayScreen --> RoutinePath
  TodayScreen --> RoutineSheet
  TodayScreen --> useTodayState
  RoutinePath --> layoutPath
  RoutineSheet --> useRoutineTimer
  RoutineSheet --> progressActions
  RoutineSheet --> platform
  useTodayState --> computeTodayState
  useTodayState --> progressStore
  useTodayState --> childStore
  computeTodayState --> content
  progressActions --> progressStore
  useRoutineTimer --> progressStore
```

## 3. 시퀀스 — 루틴 듣고 완료하기 (UC-03, UC-04)

```mermaid
sequenceDiagram
  autonumber
  actor 아이
  participant 길 as 오늘 · 루틴 길
  participant 시트 as 루틴 시트
  participant 기록 as progressStore
  participant YT as YouTube
  participant API as 서버 (연결 시)

  아이->>길: 2번 정거장 누르기
  길->>시트: 열기(theme)
  시트-->>아이: 안내 · 오늘의 한 문장 · 00:00 / 30:00
  아이->>시트: ▶ 소리 놀이 시작
  시트->>기록: startTimer(오늘, theme)
  기록-->>기록: runningSince = 지금
  시트->>YT: 영상 열기(videoId)
  YT-->>아이: 영상 재생
  loop 1초마다
    시트->>기록: 흐른 시간 읽기
    시트-->>아이: 12:34 / 30:00
  end
  alt 목표 시간에 닿음
    시트->>기록: complete(timer)
  else 아이가 직접 누름
    아이->>시트: ✓ 오늘 완료했어요
    시트->>기록: complete(manual)
  end
  기록-->>기록: listenedMin = 30, completedAt = 지금, runningSince = null
  기록-->>길: 다시 그리기
  길-->>아이: 정거장 완료 · 길 색칠 · 스티커 +1
  opt 서버 연결
    기록->>API: PUT /records/{오늘}/theme
    API-->>기록: 200 (멱등)
  end
```

## 4. 시퀀스 — 가입에서 첫 화면까지 (UC-01, UC-11, UC-12)

```mermaid
sequenceDiagram
  autonumber
  actor 부모
  participant 시작 as 시작 영상
  participant 가입 as 가입 화면
  participant 계정 as 계정 저장소
  participant 등록 as 아이 등록
  participant 아이들 as childStore
  participant 알림 as 알림 어댑터
  participant 오늘

  부모->>시작: 화면 누르기
  시작->>가입: 로그인 전 → 로그인 → 가입
  부모->>가입: 이메일 · 비밀번호 · 동의
  가입->>가입: 형식 · 길이 · 일치 검사
  가입->>계정: signUp()
  alt 이미 있는 이메일
    계정-->>가입: duplicate
    가입-->>부모: 로그인할까요?
  else 새 계정
    계정-->>가입: 세션
    가입->>등록: 이동
  end
  부모->>등록: 이름 · 연령 · 시작일 · 친구 고르기
  opt 사진
    등록->>등록: 자르기 · 256px로 줄이기 (기기 안에서만)
  end
  등록->>아이들: 프로필 저장 + 기본 알림 시각
  등록->>알림: 권한 묻기 · 알림 예약
  등록->>오늘: 이동
  오늘-->>부모: 인사 카드와 루틴 길
```

## 5. 시퀀스 — 소리활동 (UC-05, UC-06)

```mermaid
sequenceDiagram
  autonumber
  actor 아이
  participant 활동 as 소리활동 화면
  participant 문제 as buildQuiz (순수 함수)
  participant 소리 as 소리 재생
  participant 인식 as 음성 인식
  participant 판정 as judgeSpeech (순수 함수)
  participant 기록 as progressStore

  활동->>문제: buildQuiz(주차 · 연령 · 씨앗값)
  문제-->>활동: 8문제 (그림 3 · 단어 2 · 짝 1 · 문장 2)
  loop 문제마다
    활동->>소리: 단어 들려주기
    아이->>활동: 보기 고르기
    활동->>기록: addQuizAnswer(정답 여부, 걸린 시간)
    활동-->>아이: 별 또는 정답 알려 주기
  end
  Note over 활동: 단어 말하기로 넘어감
  loop 집중 단어 4개
    활동->>소리: 단어 들려주기
    아이->>인식: 말하기
    alt 인식됨
      인식-->>활동: 들은 글자
      활동->>판정: judgeSpeech(들은 글자, 단어)
      판정-->>활동: 점수 0..1
      활동->>기록: addSpeakAttempt(pass 또는 한 번 더)
    else 마이크를 못 씀
      활동-->>아이: 도움 모드
      아이->>활동: 부모가 “잘 말했어요”
      활동->>기록: addSpeakAttempt(passByParent)
    end
  end
  활동->>기록: completeActivity(별)
  활동-->>아이: 마침 화면
```

## 6. 시퀀스 — 알림 (UC-15)

```mermaid
sequenceDiagram
  autonumber
  participant 일정 as 매분 작업 (APScheduler)
  participant DB as 데이터베이스
  participant 푸시 as Web Push 서비스
  participant 기기 as 부모 기기 (서비스 워커)
  actor 부모
  participant 앱

  일정->>DB: time_local = 지금 HH:MM 이고 켜진 일정
  DB-->>일정: 아이 · 루틴 목록
  loop 일정마다
    일정->>DB: 오늘 그 루틴을 끝냈나?
    alt 아직
      일정->>푸시: “아침 노래 시간이에요” + /today?open=morning
      푸시->>기기: 알림
    else 이미 끝냄
      일정-->>일정: 건너뜀
    end
  end
  부모->>기기: 알림 누르기
  기기->>앱: /today?open=morning
  앱-->>부모: 아침 노래 시트가 열린 오늘 탭
  Note over 일정,푸시: 구독이 사라졌으면(404·410) 그 구독을 지운다
```

이 그림은 서버를 연결했을 때의 Web Push 흐름입니다. 이번 버전은 서버 없이, 앱은 기기 알림을 미리 예약하고(`buildUpcoming`) 웹은 열려 있는 동안 서비스 워커로 알림을 띄웁니다.

## 7. 시퀀스 — ‘들었어요’ 표시 (UC-09)

```mermaid
sequenceDiagram
  autonumber
  actor 부모
  participant 표 as 주간 표
  participant 규칙 as parentCheck.toggleCheck
  participant 기록 as progressStore

  부모->>표: 토요일 · 저녁 노래 칸 누르기
  표->>규칙: 이 칸을 바꿀 수 있나?
  alt 미래 · 시작일 이전 · 해당 없는 칸
    규칙-->>표: 안 됨 (눌리지 않음)
  else 앱에서 완료한 칸
    규칙-->>표: 잠김
    표-->>부모: “앱에서 완료한 기록은 지울 수 없어요”
  else 빈 칸
    표-->>부모: 들었어요로 표시할까요?
    부모->>표: 표시하기
    표->>기록: complete(parent)
  else 부모가 표시한 칸
    표-->>부모: 표시를 지울까요?
    부모->>표: 지우기
    표->>기록: clearParentCheck()
  end
  기록-->>표: 요약 · 표 · 스티커 다시 계산
```

## 8. 상태 — 루틴 기록

```mermaid
stateDiagram-v2
  [*] --> 없음
  없음 --> 듣는중: 소리 놀이 시작
  듣는중 --> 멈춤: 멈춤 (초를 쌓는다)
  멈춤 --> 듣는중: 이어 듣기
  듣는중 --> 완료_timer: 목표 시간에 닿음
  듣는중 --> 완료_manual: 오늘 완료했어요
  멈춤 --> 완료_manual: 오늘 완료했어요
  없음 --> 완료_manual: 오늘 완료했어요
  없음 --> 완료_parent: 부모가 표시
  멈춤 --> 완료_parent: 부모가 표시
  완료_parent --> 없음: 부모가 표시를 지움
  완료_timer --> [*]
  완료_manual --> [*]
  note right of 완료_timer
    앱에서 완료한 기록은
    되돌릴 수 없다
  end note
```

DB의 체크 제약이 이 상태를 그대로 지킵니다: 완료 방식과 완료 시각은 함께 있고, 완료된 줄은 `running_since`가 비어 있습니다.

## 9. 컴포넌트

```mermaid
flowchart TB
  subgraph APP["앱 · Expo (React Native + Web)"]
    direction TB
    R["app/ 경로"] --> S["screens/ 화면"]
    S --> F["features/ 기능<br/>today · journey · activity · parent · settings · splash"]
    F --> E["entities/ 규칙과 저장<br/>course · progress · child · quiz · speech · schedule"]
    F --> U["shared/ui · theme 토큰 · 문구"]
    E --> C[("content JSON")]
    E --> ST[("기기 저장소<br/>AsyncStorage · localStorage")]
    F --> P["shared/platform 어댑터<br/>.web / .native"]
  end
  subgraph EXT["기기 · 외부"]
    YT["YouTube"]
    SR["음성 인식"]
    NT["알림"]
  end
  subgraph API["서버 · FastAPI"]
    direction TB
    RT["routers<br/>auth · children · records · misc"] --> SV["services<br/>course · seed · push"]
    SV --> M["models (SQLAlchemy)"]
    M --> DB[("SQLite / PostgreSQL")]
    SC["매분 작업"] --> SV
  end
  P --> YT
  P --> SR
  P --> NT
  E -. "멱등 PUT (연결 시)" .-> RT
  C -. "시드" .-> SV
  SV -. "Web Push" .-> NT
```

## 10. 배치

```mermaid
flowchart LR
  DEV["개발자 PC"] -->|git push| GH["GitHub · lala-david/app"]
  DEV -->|expo export + gh-pages| PAGES["GitHub Pages<br/>/app (정적 웹앱 · PWA)"]
  PAGES --> PHONE["부모 · 아이의 폰 브라우저<br/>홈 화면에 추가"]
  DEV -. "EAS Build · 다음 단계" .-> STORE["앱 스토어"]
  PHONE -. "HTTPS · JWT · 연결 시" .-> SRV["FastAPI 서버"]
  SRV --> PG[("PostgreSQL")]
  PHONE --> YT["YouTube"]
```
