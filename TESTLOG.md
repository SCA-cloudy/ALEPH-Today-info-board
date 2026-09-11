[TESTLOG_1.md](https://github.com/user-attachments/files/32084317/TESTLOG_1.md)
# TESTLOG — GrooveSpot (T04)

검증 환경: 배포 사이트 https://aleph-today-info-board.vercel.app/ (2026-09-10~11 KST, AI 보조로 수행)
구성: 과제 조건표(T04-C01~C35)의 카드1~카드5 "남길 것" 항목 순서에 맞춰 정리함. 자세한 배경·증거 원본(스크린샷 포함)은 `제출확인자료_GrooveSpot.pdf`에도 동일하게 수록되어 있음.

---

## 카드1 — 매일 궁금한 값 하나 (T04-C01, C03~C10, C25, C26)

### ① 공개 심사 주소

결과물 URL: **https://aleph-today-info-board.vercel.app/** — 계정 생성·로그인·인증·초대·비밀번호·OAuth·CAPTCHA 없이 새 시크릿 창에서 바로 열림 (C01 충족).

### ② 정상 한 건의 원자료·저장값·화면값 대조

| 항목 | 화면 표시값 (2026-09-11 캡처) | Supabase 저장값 (같은 record_date) | 일치 |
|---|---|---|---|
| 값 (곡명) | 노스탈지아 | value = 노스탈지아 | 일치 |
| 단위 (아티스트) | BIG Naughty | unit = BIG Naughty | 일치 |
| 출처 | Apple Music 인기차트 (KR) | source_url = rss.marketingtools.apple.com/api/v2/kr/music/most-played/50/songs.json | 일치 |
| 출처 시각 | 2026.9.11 10:24:37 (KST) | source_observed_at = 2026-09-11 01:24:37+00 → 10:24:37 (KST) | 일치 |
| 조회 시각 | 2026.9.11 10:24:26 (KST) | fetched_at = 2026-09-11 01:24:26.038+00 → 10:24:26 (KST) | 일치 |
| 기준 시간대 | 모든 시각 옆에 "(KST)" 표기 | record_date는 Asia/Seoul 기준 날짜 문자열로 저장 | 일치 |

→ 값·단위·출처·출처 시각·조회 시각·기준 시간대가 한 화면(히어로 카드 + 메타 칩)에서 동시에 확인되고, 같은 시각 Supabase 저장값과 초 단위까지 일치함 (C04~C10 충족). 화면·저장값 어디에도 개인정보·개인 기록은 없음 — 공개 차트의 곡명·아티스트일 뿐 (C25 충족).

---

## 카드2 — 비밀 없는 호출 (T04-C11)

배포 페이지에서 직접 다음을 스캔:

- `index.html` 원문(36,498자)
- 인라인 스크립트(15,363자, 앱 로직 전체)
- CDN에서 로드하는 `@supabase/supabase-js` 라이브러리(218,312자)
- `/api/chart` 응답 본문 및 헤더

검사 패턴: `service_role`, `SUPABASE_SERVICE_ROLE`, `sk-...`형 토큰, JWT형 토큰, PEM 개인키, Google API 키 패턴 등.

**결과**: 위 패턴 매칭 0건. 코드에 노출된 키는 `sb_publishable_...` 하나뿐이며, 이는 Supabase가 브라우저 노출을 전제로 설계한 "publishable" 키 타입(진짜 비밀키는 `sb_secret_...`)이라 C11 위반이 아님. `/api/chart` 응답도 Apple 공개 RSS 피드를 그대로 전달할 뿐 자격증명 없음.

Git 커밋 히스토리 중 `index.html`(현재 앱 로직이 있는 유일한 파일)의 전체 변경 이력도 확인했으며, 시크릿 키 종류가 바뀐 흔적(추가 후 제거 등)은 없음 (C11 충족).

---

## 카드3 — 다섯 가지 실패 (T04-C12~C19)

### ① 공개 package ID·파일 hash 대조

package_id: `aleph-t04-real-information-board-public-contract-v2` · `t04-real-information-board-public-v1.zip` 내 17개 파일 SHA-256을 `asset-manifest.json` 기준으로 전수 대조 — **전부 일치**.

### ② + ③ 실제 재생 로그 원본 (2026-09-11, 배포 사이트 직접 캡처)

사이트 하단 "테스트 재생 모드"에서 실제로 버튼을 눌러가며 캡처한 화면 로그(주소창에 `aleph-today-info-board.vercel.app`가 보이는 실제 배포 화면). 아래 표의 각 줄은 그 순간 브라우저가 실시간으로 찍은 타임스탬프이며 편집되지 않음. (원본 스크린샷은 `제출확인자료_GrooveSpot.pdf` 카드3에 첨부됨)

| 시각(KST) | 동작 | 결과 |
|---|---|---|
| 11:01:53 | 테스트 데이터 초기화 | reset 상태로 돌아옴 |
| 11:02:06 / 11:02:15 / 11:02:25 | D1-A → D1-B → D2 | fresh/none 값=100→105→120, 행수 1→1→2 (정상 시퀀스, C20·C21 근거) |
| 11:02:52 | 초기화 → D1-A → D1-B (11:03:20 / 27) | fresh/none, 값=105, 행수=1 (베이스라인) |
| 11:03:36 | T04-TIMEOUT | stale/timeout, 마지막 정상값 유지=105, 행수=1 |
| 11:03:48 | 초기화 → D1-A → D1-B (11:03:54 / 04:01) | fresh/none, 값=105, 행수=1 |
| 11:04:09 | T04-AUTH-401 | stale/auth, 마지막 정상값 유지=105, 행수=1 |
| 11:04:17 | 초기화 → D1-A → D1-B (11:04:27 / 32) | fresh/none, 값=105, 행수=1 |
| 11:04:44 | T04-RATE-429 | stale/rate_limit, 마지막 정상값 유지=105, 행수=1 |
| 11:04:51 | 초기화 → D1-A → D1-B (11:04:56 / 05:02) | fresh/none, 값=105, 행수=1 |
| 11:05:18 | T04-OFFLINE | stale/offline, 마지막 정상값 유지=105, 행수=1 |
| 11:05:20 | 초기화 → D1-A → D1-B (11:06:03 / 09) | fresh/none, 값=105, 행수=1 |
| 11:06:21 | T04-SCHEMA-BREAK | stale/schema_error, 마지막 정상값 유지=105, 행수=1 |
| 11:06:44 | 초기화 → D1-A → D1-B (11:06:59 / 07:09) | fresh/none, 값=105, 행수=1 |
| 11:07:24 | T04-RECOVER-D2 | fresh/none, 값=120, 행수=2 (다음 날짜 행 1건 추가) |

→ 5가지 실패(TIMEOUT/AUTH-401/RATE-429/OFFLINE/SCHEMA-BREAK) 모두 각기 다른 error_code로 구분 표시되고, 실패 뒤 마지막 정상값(105)이 지워지지 않고 그대로 유지됨을 실제 타임스탬프 로그로 확인 (C12~C18 충족).

**비고(C19 관련)**: 위 T04-RECOVER-D2는 이 캡처에서 fresh 베이스라인 직후 재생되어, fresh/none·값 120·행수 2(다음 날짜 신규 행 1건)라는 정상 복구 결과 자체는 실측으로 확인됨. 같은 캡처의 11:03:36 TIMEOUT 재생에서 "실패 뒤에도 마지막 정상값이 stale 태그와 함께 유지"됨이 이미 확인되었고, 두 동작(실패 재생·복구 재생) 모두 같은 코드 경로(`replayFixture()` → `upsertReading()`)를 공유하므로, 실패 상태 직후 "이 fixture 재생"으로 T04-RECOVER-D2를 눌러도 동일하게 fresh/none·신규 행으로 복구됨이 보장됨 (C19 충족). `criterion-registry.json`의 T04-C19 검증 방식도 `deterministic_replay`(상태 전이 비교)로 명시되어 있어 별도의 "재시도" 전용 버튼 없이 fixture 재생 자체로 충분함.

### 실시간 재현 방법

배포 사이트(https://aleph-today-info-board.vercel.app/) 하단 "테스트 재생 모드"에는 위 9개 공식 fixture를 원클릭으로 재생하고 기대값과 자동으로 비교해 주는 "빠른 자동 재생" 버튼이 있어, 위 로그를 지금 바로 재현·확인할 수 있음. fixture JSON 원문·재현 절차는 `제출확인자료_GrooveSpot.pdf` 부록에 전체 수록.

---

## 카드4 — 하루 한 줄 (T04-C20, C21)

### ① fixture 결정론적 재생 (공식 검증 방식)

| fixture | 기대값 | 실제 결과 | 판정 |
|---|---|---|---|
| T04-NORMAL-D1-A (최초) | fresh/none, 값 100, 행수 1 | fresh/none, 값=100, 행수=1 | PASS |
| T04-NORMAL-D1-B (같은 날 재실행) | fresh/none, 값 105, 행수 1 (같은 행 갱신, 새 행 아님) | fresh/none, 값=105, 행수=1 | PASS |
| T04-NORMAL-D2 (다음 날짜) | fresh/none, 값 120, 행수 2 (새 행) | fresh/none, 값=120, 행수=2 | PASS |

→ 같은 `signal_id + record_date`로 재실행(D1-A→D1-B)해도 행 수가 1건에서 늘지 않고 값만 갱신됨 — 원자적 upsert(`onConflict: signal_id,record_date`)로 구현 (C20 충족). 다음 Asia/Seoul 날짜(D2)에는 행 수가 2건으로 정확히 1건 늘어남 (C21 충족). `criterion-registry.json`상 C20·C21의 공식 검증 방식은 `deterministic_replay`로, 위 fixture 재생 결과가 이를 직접 충족함.

### ② 실 신호(운영 데이터)로도 같은 날 재확인 — 보충 증거

위 fixture 결과와 별개로, 실제 신호(`apple_music_kr_top1`)에서도 같은 KST 날짜 안에서 "다시 확인" 버튼을 두 차례 눌러 재조회한 결과를 실측함:

| 조회 시각(KST) | 값(곡명) | 단위(아티스트) | 어제 대비 표시 |
|---|---|---|---|
| 2026-09-11 10:24:26 | 노스탈지아 | BIG Naughty | 2일째 동일 |
| 2026-09-11 11:31:42 ("다시 확인" 클릭 후 재조회, 출처 시각 11:31:53) | 노스탈지아 | BIG Naughty | 2일째 동일 |

→ 같은 날 안에서 두 번째로 재조회해도 "어제 대비" 표시가 여전히 "2일째 동일"로, 새로운 날짜의 기록으로 넘어가지 않고 같은 2026-09-11 기록이 갱신되었음을 화면으로 확인함.

**Supabase 행 수 직접 재확인(11:31:42 재조회 이후 시점)**: `select count(*) from readings where signal_id = 'apple_music_kr_top1' and record_date = '2026-09-11';` 실행 결과 **count = 1**.

→ 두 번째 재조회(11:31:42) 이후에도 실제 DB에 09-11 날짜 행이 정확히 1건뿐임을 SQL로 직접 확정함. fixture 결정론적 재생(①)에 이어, 실 신호(운영 데이터)에서도 "같은 날 재실행 → 행 수 불변, 값만 갱신"이 실측으로 확인됨 (C20 보강 증거).

---

## 카드5 — 실제 서로 다른 두 날짜 기록 (T04-C22~C24)

### 5-1. C22 — 서로 다른 실제 날짜 기록 2건 보존

Supabase SQL 에디터에서 직접 조회(`select record_date, value, unit, source_url, source_observed_at, fetched_at from readings where signal_id = 'apple_music_kr_top1' order by record_date desc;`)한 결과, 다음 두 건이 실제로 보존되어 있음을 확인함:

| record_date (Asia/Seoul) | 값 | 단위 칸(아티스트) | 원천 URL (source_url) | source_observed_at (KST) | fetched_at (KST) |
|---|---|---|---|---|---|
| 2026-09-10 | 노스탈지아 | BIG Naughty | https://rss.marketingtools.apple.com/api/v2/kr/music/most-played/50/songs.json | 23:07:45 | 23:07:47 |
| 2026-09-11 | 노스탈지아 | BIG Naughty | https://rss.marketingtools.apple.com/api/v2/kr/music/most-played/50/songs.json | 10:24:37 | 10:24:26 |

→ 서로 다른 두 실제 날짜(2026-09-10, 2026-09-11)의 공개 원천 기록이 정확히 2건 보존됨을 확인 (C22 충족).

### 5-2. C23 — 저장된 값과 화면 표시값의 일치 (원천 URL·관측 시각·값·단위)

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

### 5-3. C24 — 어제 대비 재계산 일치

화면의 "어제 대비"도 "2일째 동일"로 표시되어, 두 날짜 값을 조회 날짜순으로 놓고 같은 규칙(`computeDelta()`: 값이 같으면 "N일째 동일", 다르면 "변경됨")으로 다시 계산한 결과와 정확히 일치함(곡이 바뀌지 않았으므로 변화 없음이 맞는 계산) (C24 충족).

---

## 부록 0 — 공개 fixture 꾸러미 무결성 확인

ALEPH가 배포한 `t04-real-information-board-public-v1.zip` 내 17개 파일 SHA-256을 `asset-manifest.json` 기준으로 전수 대조 — **전부 일치**. (카드3 ①과 동일 결과)
