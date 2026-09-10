# GrooveSpot — 오늘의 차트를 기록하다

ALEPH 과제4 "오늘의 진짜 정보판 — 데이터가 안 올 때"(T04) 제출물입니다.

매일 바뀌는 실제 값 하나(Apple Music 인기차트 KR 종합 1위 곡)를 무비밀키 공개 API로 조회해 기록하고, 어제와 비교하며, 데이터가 오지 않을 때도 정직하게 상태를 설명합니다.

## 결과물

- **결과물 URL**: https://aleph-today-info-board.vercel.app/ (계정 생성·로그인·인증 없이 새 시크릿 창에서 바로 열림)
- **소스 저장소**: https://github.com/SCA-cloudy/ALEPH-Today-info-board

## 추적하는 값 (signal)

| 항목 | 내용 |
|---|---|
| 값(value) | Apple Music 인기차트(KR) 종합 1위 곡명 |
| 단위 칸(unit) | 해당 곡의 아티스트명 (범용 값/단위 스키마를 곡 정보에 맞게 재해석해서 사용) |
| 출처 | Apple Music 인기차트 (KR) |
| 출처 URL | `https://rss.marketingtools.apple.com/api/v2/kr/music/most-played/50/songs.json` (비밀키 불필요, 공개 RSS 피드) |
| 기준 시간대 | Asia/Seoul (KST) |

## 기술 구성

- **프런트엔드**: `index.html` 단일 파일(인라인 CSS/JS). 다크모드 토글, 상위 5곡 부채꼴 배치, 장르별 상위곡 섹션 포함.
- **API 프록시**: `api/chart.js` — Vercel 서버리스 함수. 브라우저 CORS 문제를 피하기 위해 Apple Music RSS 피드를 그대로 통과시켜 전달함(비밀값 없음, 순수 프록시).
- **DB**: Supabase 테이블 `readings` (signal_id, record_date, value, unit, source_url, source_observed_at, artwork_url, fetched_at, created_at 등). `unique(signal_id, record_date)`로 같은 날 재실행 시 새 행이 아니라 기존 행을 갱신.
- **배포**: GitHub(`main` 브랜치) → Vercel 자동 배포.
- **비밀값 처리**: 브라우저에 노출되는 키는 Supabase의 "publishable"(공개용) 키 하나뿐이며, 이는 Supabase가 클라이언트에 노출되도록 설계한 키 타입입니다. 실제 비밀키(service_role 등)는 어디에도 포함되어 있지 않습니다.

## 테스트 재생 모드

페이지 하단 "테스트 재생 모드"에서 ALEPH가 배포한 결정론적 fixture(zip)의 JSON을 붙여넣고 재생하면, 느림(timeout)·401·429·오프라인·응답 형식 변경 5가지 실패 상태와 정상 복구 과정을 재현해 확인할 수 있습니다. 실제 신호(`apple_music_kr_top1`)와 분리된 전용 테스트 signal(`aleph-demo-index`)에 저장되므로 실제 기록에는 영향을 주지 않습니다.

자세한 재생 결과는 `TESTLOG.md`, 통과 기준 대조는 `SUBMISSION.md`를 참고하세요.
