# 01-C 설계 및 구현 — 시간·난수·자동 진행

## 확정된 요구
- 기본 행동은 1턴, 낚시/채광 등은 **게임 콘텐츠가 지정하는 정수 턴 범위**에서 소요 턴 추출. 숙련이 높을수록 최소·최대 범위가 모두 감소해야 함.
- 범위 수치, 숙련 공식, 월·계절 길이와 세계 시각 환산은 미확정. `sampleSkilledTurns`의 숙련 입력(0~1)은 콘텐츠 성장 수치가 아니라 추상화된 숙련 진행률.
- 세계 생성 RNG와 일반 행동 RNG 독립. 현재 구현은 **버전이 명시된 xorshift32 2스트림**; 재현 가능하나 암호학적 안전 용도 아님. 난수 생성 알고리즘 변경은 저장 호환성 및 검증이 필요.
- 세계 시계는 턴과 별개로 정수 누적 단위로 갱신. 실제 시간 단위/행동별 소요 세계 시간은 확정 전까지 추상 단위; 정책 공급자가 제공.
- 자동 진행은 01-B 공통 행동 처리기 활용. 위험 타일을 BFS 탐색 경로에서 제외. HP·MP가 임계 비율 이하 / 허기 수준이 임계 비율 이상일 때 중단.
- 정보창을 열거나 탭이 숨겨지면 자동 실행 정지. **재개는 반드시 사용자 명시적 입력 필요**; 화면 복귀만으로 자동 재개되지 않음.
- 자동 한 단계에 게임 행동은 최대 1개; 현실 시간 지연으로 빠진 턴을 보충하지 않음.

## 경계와 후속 구현
- `dispatchTimedAction`은 01-B 실행 성공 후 정책상 소요 턴과 시간/RNG를 원자적으로 반영. 01-B 기존 `dispatchAction`의 성공 1턴 계약은 유지.
- 상태 규칙 검증은 기본형만 검증. 세이브·로드 및 깊은 스키마 검증은 02단계.
- 위험 지형의 상세 유형, 이동 AI, 실제 던전 UI와 자동 탐색의 통합은 해당 콘텐츠 단계.
- `AutoController.tick`은 행동 전 중단 조건 검사. **행동 후 즉시 임계값/위험을 확인해 중단하는 연동은 실제 센서 공급원 결합 시 필수**이며 현재는 다음 tick의 사전 검사로만 보장됨.
- `src/v3.js` 등 프로토타입은 수정하지 않음.

## 검증
`npm run check` 실행. 실제 01-B 일반 행동과 장기 행동의 턴 증감, 실패 시 동일 비용, 세계/행동 RNG 독립, 동일 시드 재현, 위험 경로 회피, 비율 임계값 및 정보창 일시 정지를 테스트.

## 근거
- DCSS autoexplore: https://dcss.roguelikes.gg/wiki/Auto-explore
- PCG 다중 스트림 원리: https://www.pcg-random.org/using-pcg-c.html
- MDN Page Visibility API: https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API
- Redux 순수 상태 전환: https://redux.js.org/usage/structuring-reducers/prerequisite-concepts
