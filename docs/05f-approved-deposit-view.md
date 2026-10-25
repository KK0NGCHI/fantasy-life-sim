# 05-F 승인 기반 광상 읽기 전용 스냅샷

이 구현은 **저장 파일 마이그레이션이 아니라**, 기존 광맥 재고에서 독립적으로 파생되는 직렬화 가능한 읽기 전용 광상 구성 스냅샷(sidecar)이다.

- `previewDepositMigration05F(deposits)`: 변경 없는 미리보기.
- `approveDepositView05F(deposits,preview,{approval:DEPOSIT_VIEW_APPROVAL_05F})`: 명시적인 승인 토큰과 현재 원본에 정확히 일치하는 미리보기일 때만 생성.
- `restoreDepositView05F(deposits,sidecar)`: JSON 왕복 후 다시 생성한 정규 데이터와 일치하는 경우만 승인. 데이터 조작 및 재고 변경 후 낡은 스냅샷을 거부.
- 별도 소비 가능한 광상 재고 없음. `mineralDeposits05E` 원본 저장·매장량·발견 상태·난수·시간은 불변.
- 변경된 저장이 있을 때 이전 sidecar는 유효하지 않으므로 현재 재고에서 다시 만들어야 한다.

**미구현:** save-v3에 sidecar를 저장하는 기능, 실제 저장 데이터 구조 변환, 광상 동시 산출/공유 원자적 차감, 사용자 승인 UI, 구버전 자동 변환. 해당 기능은 별도 회귀 테스트와 명시적 정책 결정 없이 활성화하지 않는다.

테스트는 원본 독립성, 승인 토큰 검사, JSON 왕복, 저장 원본 변경 후 거부, 필드·수량 조작 거부를 포함한다.
