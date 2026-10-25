# 02-D 저장 관리자 — 1차 구현 및 검증

날짜: 2026-10-22 · Draft PR #16, 기준 브랜치 `feat/02c-final-world-actions`

## 사용자 확정 결정
- 수동 슬롯 개수 제한 없음. 각각 고유한 `slotId`를 사용.
- 퀵 저장 `main-manual`, 자동 저장 `main-auto`는 수동 슬롯과 분리.
- 자동 저장은 행동 수 임계값과 주요 이벤트 모두 사용하며 사용자 설정 가능.
- 손상된 최신 저장을 자동으로 이전 기록으로 교체하지 않는다. 정상 복구 후보를 열거하고 사용자 승인 후에만 적용.
- JSON 파일 가져오기에는 8 MB 제한, 형식과 콘텐츠 정의 검증을 적용.
- **무게 시스템 없음**, 영구 버리기 및 기존 모달 확인 규칙 유지.

## 반영한 코드
- `IndexedDbSavesV2.listSlots()`: 포인터를 읽어 슬롯·revision·상태(`valid/damaged`)를 제공. 파손 최신 기록을 숨기거나 정상 이전 기록으로 대체하지 않음.
- `main-v2-inventory.js`: `save(kind,slotId,label)`, `listSlots()`, `recoveryCandidates(slotId)`, `loadCandidate(slotId)`, `applyApprovedSave`, 자동저장 정책. 일련의 자동저장을 순차 작업으로 직렬화.
- 메인 UI 상단의 저장 아이콘: 수동 저장, 퀵 저장, 개별 슬롯 불러오기, JSON 백업 내보내기, JSON 파일 가져오기, 정상 이전 revision 조회, 자동 저장 간격·이벤트 설정.
- 복구 후보를 읽거나 JSON을 검사해도 실제 게임 상태를 바꾸지 않는다. 확인 모달의 **불러오기 승인** 후에만 반영.
- 기존 v1 저장 데이터베이스와 `fantasy-v2-demo` localStorage는 변경하지 않는다.

## 검증 범위 및 남은 과제
- GitHub CI는 TypeScript 엔진·Node 테스트·메인 UI 문법/기존 계약만 검증. 슬롯 관리 브라우저 수동 검증은 별도로 해야 한다.
- 현행 메인 v2 데이터에는 인벤토리, 플레이어 수치, 턴, RNG, 지역·던전 여부·좌표가 포함되어 있지만 **UI 로그·탐험 도감·퀘스트 등 모든 시제품 정보가 정식 세이브에 포함된 것은 아님**.
- 다중 슬롯 덮어쓰기 UI, 보관 슬롯 삭제 UI는 구현되지 않음. 기존 저장을 삭제/덮어쓰기하는 위험을 피하고 새 수동 슬롯 생성 우선.
- 자동 저장 설정은 현재 브라우저 실행 동안 적용. 영속적인 사용자 설정 및 자동 저장 성공/실패 알림 강화가 필요.
- IndexedDB는 트랜잭션 일관성을 보장하지만 영구 데이터 보존까지 보장하지 않는다. 브라우저 저장소 삭제 및 디스크 장애를 고려한 외부 JSON 백업 유지.
- v1 JSON 백업의 정의 ID는 메인 콘텐츠 레지스트리와 일치해야 이전 가능. 일치하지 않으면 실패시키고 원본 유지.

## Mac 브라우저 확인 절차
```bash
git fetch origin
git switch feat/engine-02d-save-manager
npm run check
python3 -m http.server 8000
```
`http://localhost:8000/`에 접속한다.
1. 상단 저장 아이콘으로 저장 관리자 열기 → **새 수동 저장** 두 번 → 슬롯 두 개 표시 확인
2. 한 슬롯에서 **백업** 눌러 JSON 내려받기
3. 지역 이동/던전 조작 후 다른 슬롯을 불러오기 → 별도 **승인 모달**에서 취소하면 현재 상태 유지, 승인 시 이전 상태 복원
4. 같은 슬롯의 **이전 기록**에서 원하는 revision을 선택해 승인 방식 확인
5. JSON 가져오기 → 유효한 v2 데이터만 승인 후 복원, 잘못된 파일은 거부
6. 자동 저장 간격을 2로 지정하고 생활 행동 2회 → `main-auto` 슬롯 생성 확인. 주요 이벤트 저장 설정을 켠 경우 지역 이동 뒤 자동 저장 확인
7. 브라우저를 새로고침하고 슬롯 목록과 데이터가 남아 있는지 확인

참고 문서:
- [MDN IndexedDB Basic Terminology](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Basic_Terminology)
- [MDN Using IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB)
- [MDN transaction durability](https://developer.mozilla.org/en-US/docs/Web/API/IDBDatabase/transaction)
