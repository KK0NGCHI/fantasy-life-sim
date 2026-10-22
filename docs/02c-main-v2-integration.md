# 02-C — 메인 UI v2 인벤토리/저장 연결

## 직접 연결된 기능
- 기존 `index.html`의 인벤토리에서 평상시 체크박스 숨김 → 버리기 누른 뒤 다중 선택, 옆의 확인/취소, 최종 모달 순서 유지.
- 메인 인벤토리는 `createMainV2Inventory`가 보유하는 `GameStateV2.itemWorld`에서 표시값을 투영. 이름·그룹·도감용 설명은 기존 시제품 데이터의 *표현 메타데이터*이며, 아이템 ID·수량·인벤토리 소유권은 v2가 정본.
- 삭제: 목업 배열을 직접 `filter`하던 코드를 제거하고 `prepareBulkDiscard` / `confirmBulkDiscard`에만 접근. 승인 시 실제 v2 아이템 상태 변경, 상태 검증/오래된 확인창 감지. 월드에 삭제 아이템을 남기지 않음.
- F5: v2 저장 봉투와 메인 전용 IndexedDB `somnium-main-v2` 저장, revision 충돌 보호.
- F9: 최신 저장 후보를 읽고 사용자 승인 모달을 거친 후 v2 상태를 교체. 손상된 최신 세이브의 자동 복구는 하지 않음.
- 메인 게임 UI에는 무게 관련 정렬·상세 표시를 사용하지 않음.

## 의도적인 경계
- 기존 `fantasy-v2-demo` localStorage 목업 파일은 **자동으로 읽거나 변환하지 않음**. 데이터 보존과 충돌 위험 회피.
- 기존 메인 UI의 생활/지역/던전/제작은 아직 시제품 로직이어서 이 변경으로 모두 v2 행동이 되는 것은 아님.
- 엔진 v2 itemDefinition의 명칭/태그는 기존 메인 목업 목록으로 부트스트랩한다. 가변 품질/희귀도/소재 인스턴스 데이터를 진짜 콘텐츠 팩으로 매핑하는 작업은 추후.
- 메인 UI 퀵 저장은 인벤토리/플레이어 수치/턴 등 v2 상태를 보존한다. 목업 화면의 모든 속성(로그, 테마, 지도 탐험 상태 등)을 보존하는 정식 전역 세이브 기능으로 간주하지 않는다.
- `v2.html`은 이전 독립 게임 실행 검증용으로 그대로 유지한다.

## 브라우저 수동 확인
```bash
git fetch origin
git switch feat/02c-main-v2-state-integration
npm run check
python3 -m http.server 8000
```
`http://localhost:8000/` → 인벤토리 → 버리기 → 두 항목 선택 → 확인 → 팝업 취소 (변경 없어야 함) → 다시 확인해 영구 삭제 → F5 저장 → 새로고침 → F9 불러오기/승인 → 삭제된 수량이 정상 복원됐는지 확인. 저장은 메인 v2 전용 DB를 사용하므로 기존 v1 데이터베이스를 변경하지 않는다.

참고: [MDN dialog](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog), [MDN IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB).
