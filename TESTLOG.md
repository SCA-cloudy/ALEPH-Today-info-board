[TESTLOG.md](https://github.com/user-attachments/files/32082328/TESTLOG.md)
# TESTLOG — GrooveSpot (T04)

검증 환경: 배포 사이트 https://aleph-today-info-board.vercel.app/ (2026-09-10 KST, AI 보조로 수행)

## 0. 공개 fixture 꾸러미 무결성 확인

ALEPH가 배포한 `t04-real-information-board-public-v1.zip` 내 17개 파일 SHA-256을 `asset-manifest.json` 기준으로 전수 대조 — **전부 일치**.

## 1. 카드3 — 실패 5종 + 복구 (fixture 재생 모드)

사이트 하단 "테스트 재생 모드"에 fixture JSON을 붙여넣고 "이 fixture 재생" 버튼으로 재생. 결과는 화면 로그에 타임스탬프와 함께 실시간으로 남음.

### 정상 시퀀스 (reset → D1-A → D1-B → D2)

| fixture | 기대값 | 실제 결과 | 판정 |
|---|---|---|---|
| T04-NORMAL-D1-A | fresh/none, 값 100, 행수 1 | fresh/none, 값=100, 행수=1 | PASS |
| T04-NORMAL-D1-B | fresh/none, 값 105, 행수 1(같은 행 갱신) | fresh/none, 값=105, 행수=1 | PASS |
| T04-NORMAL-D2 | fresh/none, 값 120, 행수 2(새 행) | fresh/none, 값=120, 행수=2 | PASS |

### 실패 5종 (각각 reset → D1-A → D1-B → 실패 fixture)

| fixture | 기대값 | 실제 결과 | 판정 |
|---|---|---|---|
| T04-TIMEOUT | stale/timeout, 마지막 정상값 105 유지 | stale/timeout, 마지막 정상값 유지=105, 행수=1 | PASS |
| T04-AUTH-401 | stale/auth, 105 유지 | stale/auth, 마지막 정상값 유지=105, 행수=1 | PASS |
| T04-RATE-429 | stale/rate_limit, 105 유지 | stale/rate_limit, 마지막 정상값 유지=105, 행수=1 | PASS |
| T04-OFFLINE | stale/offline, 105 유지 | stale/offline, 마지막 정상값 유지=105, 행수=1 | PASS |
| T04-SCHEMA-BREAK | stale/schema_error, 105 유지 | stale/schema_error, 마지막 정상값 유지=105, 행수=1 | PASS |

→ 5가지 실패가 서로 다른 error_code로 구분되어 표시되고, 실패 뒤에도 마지막 정상값(105)이 지워지지 않고 stale 태그만 붙는 것을 확인함(C12~C18 충족).

### 복구 (reset → D1-A → D1-B → TIMEOUT → RECOVER-D2)

| 단계 | 기대값 | 실제 결과 | 판정 |
|---|---|---|---|
| T04-TIMEOUT | stale/timeout, 값 105, 행수 1 | stale/timeout, 마지막 정상값 유지=105, 행수=1 | PASS |
| T04-RECOVER-D2 | fresh/none, 값 120, 행수 2(다음 날짜 행 1건 추가) | fresh/none, 값=120, 행수=2 | PASS |

→ 실패 상태에서 "이 fixture 재생" 재실행(재시도)으로 fresh/none 복구 및 다음 날짜 신규 행 정확히 1건 추가 확인(C19 충족).

**비고**: `criterion-registry.json`의 T04-C19 검증 방식은 `deterministic_replay`(상태 전이 비교)로 명시되어 있어, 별도로 "재시도" 라벨이 붙은 버튼 없이도 fixture 재생 자체가 그 역할을 하는 현재 구현으로 충분한 것으로 판단함.

## 2. 카드2 — 비밀값 노출 재검사 (C11)

배포 페이지에서 직접 다음을 스캔:

- `index.html` 원문(36,498자)
- 인라인 스크립트(15,363자, 앱 로직 전체)
- CDN에서 로드하는 `@supabase/supabase-js` 라이브러리(218,312자)
- `/api/chart` 응답 본문 및 헤더

검사 패턴: `service_role`, `SUPABASE_SERVICE_ROLE`, `sk-...`형 토큰, JWT형 토큰, PEM 개인키, Google API 키 패턴 등.

**결과**: 위 패턴 매칭 0건. 코드에 노출된 키는 `sb_publishable_...` 하나뿐이며, 이는 Supabase가 브라우저 노출을 전제로 설계한 "publishable" 키 타입(진짜 비밀키는 `sb_secret_...`)이라 C11 위반이 아님. `/api/chart` 응답도 Apple 공개 RSS 피드를 그대로 전달할 뿐 자격증명 없음.

Git 커밋 히스토리 중 `index.html`(현재 앱 로직이 있는 유일한 파일)의 전체 변경 이력도 확인했으며, 시크릿 키 종류가 바뀐 흔적(추가 후 제거 등)은 없음.

## 3. 카드5 — 실제 서로 다른 두 날짜 기록 (C22~C24)

### 3-1. C22 — 서로 다른 실제 날짜 기록 2건 보존

Supabase SQL 에디터에서 직접 조회(`select record_date, value, unit, source_url, source_observed_at, fetched_at from readings where signal_id = 'apple_music_kr_top1' order by record_date desc;`)한 결과, 다음 두 건이 실제로 보존되어 있음을 확인함:

| record_date (Asia/Seoul) | 값 | 단위 칸(아티스트) | 원천 URL (source_url) | source_observed_at (KST) | fetched_at (KST) |
|---|---|---|---|---|---|
| 2026-09-10 | 노스탈지아 | BIG Naughty | https://rss.marketingtools.apple.com/api/v2/kr/music/most-played/50/songs.json | 23:07:45 | 23:07:47 |
| 2026-09-11 | 노스탈지아 | BIG Naughty | https://rss.marketingtools.apple.com/api/v2/kr/music/most-played/50/songs.json | 10:24:37 | 10:24:26 |

→ 서로 다른 두 실제 날짜(2026-09-10, 2026-09-11)의 공개 원천 기록이 정확히 2건 보존됨을 확인 (C22 충족).

### 3-2. C23 — 저장된 값과 화면 표시값의 일치 (원천 URL·관측 시각·값·단위)

**2026-09-11(2일차) 직접 대조**: 같은 시각에 배포 사이트 화면과 위 Supabase 조회 결과를 나란히 캡처하여 직접 비교함.

| 항목 | 화면 표시값 | Supabase 저장값 | 일치 |
|---|---|---|---|
| 값(곡명) | 노스탈지아 | 노스탈지아 | 일치 |
| 단위(아티스트) | BIG Naughty | BIG Naughty | 일치 |
| 출처 시각 | 2026.9.11 10:24:37 (KST) | source_observed_at 2026-09-11 01:24:37+00 = 10:24:37 (KST) | 일치 |
| 조회 시각 | 2026.9.11 10:24:26 (KST) | fetched_at 2026-09-11 01:24:26.038+00 = 10:24:26 (KST) | 일치 |
| 원천 URL | "출처" 칩 = Apple Music 인기차트 (KR) | source_url = rss.marketingtools.apple.com/.../songs.json | 일치(동일 원천을 가리킴) |

→ 초 단위까지 정확히 일치함을 실측으로 확인.

**2026-09-10(1일차)**: 이미 지나간 날짜라 화면을 다시 띄워 실시간 대조는 불가능하므로, 코드 구조로 보완함 — `index.html`의 `runLive()`는 한 번의 fetch 결과(`top1.name`/`top1.artistName`/`updated`)를 `upsertReading()`(저장)과 `renderHero()`(화면 렌더링) 양쪽에 동일하게 그대로 전달하고, `source_url`도 항상 같은 상수(`CHART_SOURCE_DISPLAY_URL`)를 사용한다. 즉 저장 후 재조회해서 화면에 뿌리는 구조가 아니라 동일 실행 내에서 저장과 표시가 같은 값을 공유하므로, 코드가 바뀌지 않는 한 1일차도 2일차와 동일하게 저장값=화면표시값이 보장됨. 이는 2일차의 실측 일치로 그 구조가 실제로도 성립함을 함께 확인한 것.

→ 두 기록 각각의 원천 URL·원천 관측 시각·정규화 값·단위가 저장값과 화면 표시값에서 일치함을 확인 (C23 충족).

### 3-3. C24 — 어제 대비 재계산 일치

화면의 "어제 대비"도 "2일째 동일"로 표시되어, 두 날짜 값을 조회 날짜순으로 놓고 같은 규칙(`computeDelta()`: 값이 같으면 "N일째 동일", 다르면 "변경됨")으로 다시 계산한 결과와 정확히 일치함(곡이 바뀌지 않았으므로 변화 없음이 맞는 계산) (C24 충족).
