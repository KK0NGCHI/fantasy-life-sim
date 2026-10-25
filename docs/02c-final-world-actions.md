# 02-C — 메인 UI 세계·생활·던전 행동 v2 연결

## 핵심
- `main-v2-inventory.js`의 `GameStateV2`는 아이템뿐 아니라 세계 지역, 던전 진입 여부, 플레이어 타일 위치, 턴, 세계 시간, HP/MP/허기를 보유한다.
- `V2ActionDispatcher`를 통해 `life.activity`, `world.travel`, `dungeon.enter`, `dungeon.move`, `dungeon.leave`를 실행. 실패 시 변경 금지; 접수 성공 시 턴과 추상 세계시간 1단위만 증가.
- `index.html` 메인 UI는 엔진 결과를 화면에 투영. 지역 및 던전 위치는 `state.world.runtime`에서 복원한다. 재사용하는 메인 전용 IndexedDB v2 저장 포맷이 해당 세계 상태를 포함한다.
- 기존 자동 던전 시연도 `dungeonMove`를 거쳐 공통 처리기를 호출한다. 벽 타일에 대한 현재 화면 규칙은 여전히 시제품이다.
- 아이템 선택/확인/삭제와 F5/F9는 직전 통합 범위를 유지. 모달 승인 전에는 상태를 변경하지 않음.
- 무게를 엔진 및 UI에 도입하지 않음. v1 localStorage 저장을 자동 대체하지 않음.

## 한계 및 다음 검증
- `life.activity`는 실제 채집/성장/재료 획득을 계산하지 않는 **기본 행동 핸들러**이다. 턴만 정식 v2에서 소비한다.
- 지형/실제 타일·NPC·수확·퀘스트/도감·UI 로그·자동 진행 설정은 아직 메인 시제품 화면 상태에 의존한다. 전부 완전한 정식 월드 세이브라고 주장하지 않는다.
- 현재 `world.runtime`은 현행 저장 검증이 허용하는 확장 필드에 보존된다. 장기적으로 더 엄격한 세계 상태 검증이 필요하다.
- 월드 좌표의 충돌/위험 검사도 엔진 세계 도메인으로 옮겨야 하며, 현재 메인 UI에서 검증한다.
- `npm run check` 와 Mac에서 직접 F5→페이지 새로고침→F9→승인해 지역·던전 여부·좌표·턴·아이템이 동일한지 검증한다.

참조: https://redux.js.org/style-guide/ (순수 상태 변경), https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB (트랜잭션과 저장 동작)
