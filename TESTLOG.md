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

## 3. 카드5 — 실제 서로 다른 두 날짜 기록

과제 진행 중 실제 KST 자정 전후로 실 신호(`apple_music_kr_top1`)를 재조회하여, Supabase에 다음 두 건이 실제로 보존된 것을 REST API로 직접 확인함:

| record_date (Asia/Seoul) | 값 | 단위 칸(아티스트) | source_observed_at (KST) |
|---|---|---|---|
| 2026-09-10 | 노스탈지아 | BIG Naughty | 23:07:45 |
| 2026-09-11 | 노스탈지아 | BIG Naughty | 00:09:04 |

화면의 "어제 대비"도 "2일째 동일"로 표시되어 두 값이 같다는 재계산 결과와 일치함(곡이 바뀌지 않았으므로 변화 없음이 맞는 계산).
