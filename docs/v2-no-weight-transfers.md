# Somnium v2 아이템 줍기·영구 버리기 — 무게 시스템 제외

2026-10-22 확정:
- **무게 자체를 게임 규칙에 사용하지 않는다.** 아이템 무게, 소지 무게, 적재 한도, 이동 패널티, 컨테이너 무게 제한은 구현하지 않는다.
- 아이템 버리기는 땅에 배치하지 않고 **즉시 영구 삭제**. 여러 종류와 부분 수량을 한꺼번에 선택할 수 있다.
- 버리기 직전에 **실제 모달 팝업**에서 목록과 수량을 보여주고 명시적으로 확인해야 한다. 취소/Esc는 변경 없음.
- 대량 버리기는 승인 후 원자적으로 1턴. 확인 전 취소는 0턴. 오래된 턴 번호나 서로 다른 선택 목록의 승인은 무효.
- 줍기는 세계에 이미 있는 아이템을 플레이어 인벤토리로 이동한다. 신규 전리품 생성/좌표와 플레이어 위치 비교는 후속 실제 월드 규칙 연동 대상.

## 구현
- `src/engine/core/item-transfers-v2.ts`: previewDiscard, discardSelected, pickUpItem (무게 필드/검사 없음).
- `tests/item-transfers-v2.test.mjs`: 일괄 버리기·부분 수량·승인 필수·원자성·줍기 테스트.
- `tests/browser-bulk-discard.html`: 기본 UI 변경 없이 브라우저 네이티브 `<dialog>`를 사용한 확인 팝업 체험/검증.
- 주의: 이 모달은 **독립 테스트 페이지**이며 게임 기본 인벤토리 UI에 연결된 것이 아니다. 실제 UI 연결 시 팝업 확인 이벤트에서만 삭제 API를 호출해야 한다.
- `GameStateV2`의 일반 행동 통일과 실제 UI 연동도 후속 단계. 기존 저장/브라우저 UI 건드리지 않음.

## 참조
- [CDDA Advanced Inventory](https://srgnis.github.io/cdda-wiki/cdda_wiki/Advanced_Inventory_management.html): 수량 지정 및 일괄 선택 UX만 참조. CDDA의 아이템 지면 버리기/무게/용량 규칙은 채택하지 않음.
- [MDN dialog](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog): `showModal()`, Esc 및 초점 처리.
