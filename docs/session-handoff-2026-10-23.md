# Somnium 새 세션 인수인계 — 2026-10-23

## 최우선: 현재 상태와 안전 기준
- GitHub: https://github.com/KK0NGCHI/fantasy-life-sim
- 이번 화면 시계 수정 브랜치: `fix/header-global-clock-and-handoff`, 부모 `feat/global-clock-v3-saves`.
- 원본 저장 데이터 절대 삭제/덮어쓰기 금지. 신규 세이브는 v3 전용 IndexedDB(`somnium-main-v3`), 기존 v2(`somnium-main-v2`)는 보존하고 읽기만 한다.
- 기존 03-A/03-B/시간 설계/저장 PR은 **중첩 Draft 브랜치**에 누적되어 있다. `main` 병합 완료로 오해하지 말고 PR 의존 관계를 확인.
- Mac 환경: `python3`, `npm`, Git, Chrome/Safari. 사용자가 직접 브라우저에서 확인한 결과와 CI를 구분.
- 무게 시스템 구현 금지. 아이템 '버리기'는 영구 소멸, 버리기 모드에서만 체크박스, 전체 선택 없음. SUIT Variable 및 8개 테마를 유지.

## 글로벌 시계 계약
- 누적 게임 시간 1단위 = 게임 내 1초, 1일 = 86,400초, 새 게임은 1일차 08:00.
- 턴은 행동 처리 수이며 게임 내 경과 초와 독립. UI 열람 0턴/0초.
- 기존 v2 `elapsedUnits`는 역사적으로 추상값이었다. `timeBasis:'seconds-v1'` 없는 원본을 초로 자동 환산 금지.
- v3 `clock:{elapsedSeconds,calendarId:'somnium-calendar-v1',startSecondOfDay:28800}`.
- `src/engine/v3.ts`에서 V3ActionDispatcher 및 v3 저장 codec 제공. 메인 UI는 아직 v2 action adapter + v3 persistence bridge를 사용.
- 수정 사항: `src/v3.js` 상단 시간은 `mainV2.gameTime()`에서 날짜/시/분/**초** 표시. 새 `tests/header-global-clock.test.mjs`는 짧은 행동 및 생활 행동 6회 시간 진행 확인.

## 큰 로드맵 — 순서 유지, 단계 완료와 검수 구분
1. **현재 패치 검수**: `npm run check`, Chrome/Safari 시간 08:00:00→행동→08:01:00/08:06:00, 광역 숲 25분, F5/F9 저장-복구까지 확인. 저장 안전성 최우선.
2. **PR 의존성 정리**: 02-D 종료(개발 완료), 03-A 세계 데이터 레지스트리 및 수명(기본 구현), 03-B 비가시 교통로/스킵 여행/확률형 인카운터, 글로벌 시간 및 v3 세이브와 이번 UI 시계 수정. 이들은 누적 Draft이므로 병합 전략과 테스트 선행.
3. **03-C — 로컬 필드·타일 이동**: 필드/던전 타일, 상하좌우 이동, 장애물, 출입구/계단 전환, 시야와 과거 발견, 위험 회피, 자동 탐색(한 틱 한 행동), 메인 UI 연동. 월드 정의와 v3 저장의 안정 ID를 반드시 사용.
4. **03-D — 생성형 일반 필드·던전**: 고정 핵심 세계+시드 기반 변주, 장소별 결정적 RNG, 맵 입구 도달성 검증, 임시/재생/반복 수명. 시계 기반 만료 시 플레이어 내부 점유 보호, 일시적으로 생기는 임의의 필드가 필수 지역 연결을 끊지 않도록 한다.
5. **03-E — 세계 변경의 영속화**: 생성한 장소/자원/문/변화 Delta, 방문/탐험 기억, 인카운터·여행 진행 상태, 필드 만료 시각을 정식 v3 저장에 연결하고 구형 저장의 명시적 이전·비파괴 회귀 시험.
6. **03-F — 03단계 통합 안정성**: Mac Chrome/Safari(필요하면 Windows Edge/Chrome 추가)에서 월드/던전, 여행, 장시간 스킵, 인카운터, 자동 탐색 중단, 저장/복구, 16개 지역 지도 UI/테마 점검. 개발 완료와 실브라우저 검수 별도.
7. **이후 단계**: 원래 프로젝트의 최신 로드맵 문서를 다시 확인한 뒤 몬스터/NPC/성장·제작·생활/환경/퀘스트 등 실제 컨텐츠 단계 우선순위를 확정할 것. 기억만으로 04 이후 세부 단계 명칭을 새로 단정하지 말 것.

## 현재 중요한 기술 결함/후속 개선
- 현행 `world.runtime.day/hour`는 레거시 미러. 표시 정본은 `gameTime()`, 추후 전역 UI 전반에서 중복 상태 제거.
- 실제 몬스터/조우 보상은 placeholder 안내 팝업. 03-B 인카운터 확률은 시험값 12%/교통 구간.
- 4×4 지역 UI는 실제 거리 아님. 지리적 이동 시간은 정의된 보이지 않는 교통로별 seconds.
- 03-A 지역 맵 5×5/입구 자기참조는 시험용. 로컬 진입·층 연결은 03-C에서 완성.
- 태그 없는 옛 v2는 별도 승인 및 시간 재기준화 후 새로운 v3 슬롯에 복제. 이동/필드 시간 기록이 불명확하면 자동 이전 거부.
- 모든 중요 기능은 실패 시 state/RNG/revision 불변 검사 및 실제 브라우저 인수 테스트 추가.

## Mac 테스트
```bash
git fetch origin
git switch fix/header-global-clock-and-handoff
git pull --ff-only
npm install
npm run check
python3 -m http.server 8000
```
Open http://localhost:8000 and hard refresh with Cmd+Shift+R when assets are stale. In Chrome DevTools `Cmd+Option+I` and Network tab Disable cache if necessary. Clock should advance only on game actions, never by wall-clock passage.

## PR/문서 링크
- PR #28: https://github.com/KK0NGCHI/fantasy-life-sim/pull/28
- 시간 v1 설계: `docs/global-clock-contract-v1.md`
- 시간/v3 구현: `docs/global-clock-v3-implementation.md`
- 03-A: `docs/03a-world-contract.md`, `docs/03a-final-acceptance.md`
- 03-B: `docs/03b-travel-revision.md`, `docs/03b-seconds-implementation.md`
