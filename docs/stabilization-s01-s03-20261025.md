# S-01/S-03 · PR 체인과 자원 원장 안정화 (2026-10-25)

## 기준
- 출발점: `feat/05i-refined-tool-crafting` @ `3fe4ac1085f2ef36b98b361f99a355e0e6bb02bf`.
- GitHub에 열린 PR 84개, 모두 미병합 Draft. `main` 대상으로 바로 열린 PR은 #1뿐이다.
- 대부분 직전 PR 브랜치를 base로 사용하는 스택이며 #30, #31, #32는 같은 `feat/global-clock-v3-saves`에서 갈라진 병렬 작업이다. #32는 기존 병렬 변경의 통합 지점으로 설명되어 있다.
- 최신 head의 GitHub Actions `Prototype checks`, `Engine 01-A` 성공을 확인했다. 이 브랜치의 후속 CI 실행 및 실제 브라우저 수동 QA는 별개다.
- `main` 병합, 원본 브랜치 이동, PR 재지정, 강제 push, 기존 데이터 마이그레이션은 이번 변경 범위에서 제외한다. **기존 테스트/세이브 데이터의 폐기 가능**은 개발 데이터 복원 호환을 필수 조건으로 삼지 않아도 된다는 뜻이며 실제 삭제를 수행했다는 뜻이 아니다.

## 자원 경로의 권위 원장
| 경로 | 상태 원장 | 지급 경로 | 점검 |
| --- | --- | --- | --- |
| `resource.work` | `resource05A.nodes` | `itemWorld` | 광물 채굴 시 `consumeLegacyMineral05E`로 광물 원장 차감. 두 원장 간 잔량·실패 원자성 회귀 유지 |
| `mineral.extract` | `mineralDeposits05E` | `itemWorld` | 저장된 광물별 유한 재고가 권위, 광상 묶음에 별도 차감 가능 재고 없음 |
| `mineral.assemblage.extract` | 동일 `mineralDeposits05E` | `itemWorld` | 명시된 광물군만 허용, 소비는 광물별 원장 한 번씩 |
| `resource.candidate.work` | `candidateSites` | `itemWorld` | 초기 시험용 후보 원장, 같은 정의를 참조하는 다른 경로와 중복 수급 여부 후속 점검 |
| `botanical.patch.harvest` | `ecologySites` / 균류 기질 | `itemWorld` | **수정:** 종(species) ID가 아닌 실제 산출 아이템 ID로 인벤토리 인스턴스를 식별 |
| `resource.incidental.search` | 해당 `ecologySites` / `candidateSites` | `itemWorld` | 여러 활동의 확률적 보상; 동일 생물 군락에 대한 재고 차감 검증 필요 |

## 실제 수정
직접 식물/균류 채집에서 인벤토리 스택 ID가 `ecology05a:<speciesId>`였으나, 같은 식물이 기본 산출물과 씨앗 등 여러 정의 ID를 낼 수 있다. 이때 기존 스택의 `definitionId`는 첫 획득 종류로 남고 후속 획득 수량만 누적될 수 있었다. `ecology05a:<actual output itemId>`로 바꾸어 산출물 정체성을 보존한다. 관련 회귀 검사를 `tests/05a-ecology-core.test.mjs`에 추가한다.

## 남은 차단 조건 (완료로 표시하지 않음)
1. 전체 브랜치의 로컬 `npm run check`를 실행하지 못했으며, 안정화 브랜치 CI의 결과를 확인해야 한다.
2. `resource.work`와 `mineral.extract`가 같은 원장을 차감하더라도 접근 가능한 소진·재생 경로 전체의 보존성 검증이 필요하다.
3. `candidateSites`와 `ecologySites`에서 동일 보상을 허용하는 구성을 조사하고, 동일 실제 원장으로 묶을지 *시험용 경로를 새 게임에서 비활성화*할지 결정해야 한다. 중복임이 입증되기 전 데이터 삭제나 시스템 통폐합은 하지 않는다.
4. 직접 채집·우연한 발견·제작·채광 각각의 아이템 지급을 공통 검증 계층으로 정리하는 작업은 후속 소규모 PR로 나눈다.
5. 수동 브라우저 QA 및 기존 저장 파일 삭제는 수행하지 않았다.

## 통합 권고
이 PR은 05-I에 쌓인 안전한 소규모 수정이다. 이후 `main`에 초기 PR부터 반복 병합하기보다는 전용 통합 브랜치의 코드/테스트 동등성 확인, 단일 통합 PR 검토, 명시적 병합 승인 순으로 진행한다. 과거 Draft PR 84개를 자동 종료하지 않는다.

## 추가 수정 — 수정 광맥 원장 단일화
신규 05-E 광물 원장이 활성화된 게임에서 이전 `resource.candidate.prospect`가 재생성형 수정 광맥을 새로 만들고, `resource.candidate.work`가 05-E 유한 매장량을 차감하지 않는 우회 공급 경로를 확인했다. 05-E 활성화 환경에서는 기존 수정 후보 발견/탐사/채굴 명령을 명시적으로 거부한다. 정상 `mineral.prospect`/`mineral.extract`가 유한 광물 원장을 이용하도록 유지한다. 05-E가 꺼진 격리된 이전 시험 환경은 기존 후보 실험을 사용할 수 있다. 세 명령의 거부 전후 상태 불변과 정식 탐사의 성공을 검사하는 회귀 테스트를 추가했다.

이 변경은 신규 저장 스키마나 자동 마이그레이션을 도입하지 않는다. 후보 데이터 자체는 테스트/이행 분석을 위해 보존한다.
