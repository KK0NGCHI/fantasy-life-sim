# Somnium — 개발 현황 단일 기준 (2026-10-24)

> **현재 문서 우선순위**: 사용자가 명시적으로 확정한 규칙 > 최신 실제 코드·테스트 > 이 현황/로드맵 > 과거 단계별 문서의 당시 제안. 기록성 문서는 삭제하지 않는다. 제안과 구현을 혼동하지 않는다.
>
> **작업 기준 브랜치**: `feat/04d-save-progression-hardening`. 여기의 내용은 **Draft PR 체인**에 존재하며 기본 `main`에 들어간 내용이 아니다. 문서 정리 PR은 이 브랜치 위에 쌓인다.

## 현재 상태 요약
| 범위 | 확인된 구현 | 아직 구현되지 않았거나 미검증인 범위 |
| --- | --- | --- |
| 01~02 기본 엔진 | TypeScript 공통 행동 처리·턴·게임 시계, v2/v3 저장 경로, 인벤토리 상태 기본 계약 | 경제·생산·전투를 완성한 상태는 아님 |
| 03-A/B 지역·이동 | **16개 고정 광역 지역**, 지역 그래프 이동·중단 가능한 여정 | 모든 지역을 타일 지도로 탐사하지 않음 |
| 03-C/D 탐색·생성 | 미궁 로컬 타일 이동, 발견 시야, 안전 경로, 생성기 기반 지도·연결 계단 | 숲 생성기는 내부 시험용, 숲 전체 타일 탐험 아님 |
| 03-E 세계 영속화 | 시드·생성 지형 스냅샷·발견 기록·Delta 저장 형식 | 채집 노드·문·몬스터 등 실제 월드 객체 Delta 소비 미구현 |
| 03-F 안정화 | Linux 엔진, Windows 자동 검사, Chromium E2E 기반 통합 테스트 | 사용자 Windows Chrome/Edge 수동 QA 별도 |
| 04-A 성장 | 54개 독립 숙련/6계열, 7개 능력치, 숙련 표시, 생성 10포인트, 30레벨 이후 성장 수치 엔진 | 대부분 숙련은 지급 가능한 실제 행동이 없음. 탐색의 신규 미궁 타일 발견만 실제 XP 지급 |
| 04-B 캐릭터 출신 | 8종 종족 **후보**, 16종 배경 **후보**, 선택 UI, 독점 능력 ID, 시작 숙련, 3단계 신체 크기 | 고유 종족 효과·규격 장비·통로의 실제 크기 판정 미연결 |
| 04-C 배경 활동 | 배경별 1개씩, 16개 지역 한정 일회성 **정보 해석/발견** 행동, 기록 플래그·60초 | 배경별 거래·제작·NPC·신앙 등 전문 콘텐츠는 **기반 시스템이 생길 때까지 보류** |
| 04-D 저장 보강 | v3 디코더의 선택 성장/종족 데이터 검증, 변조 방지 회귀, 원본 보호형 승인 이전 **후보 준비 API** | **이전 UI 및 IndexedDB 새 슬롯 실제 기록 미연결**; 구 저장을 자동 이전하지 않음 |

**상태 판정의 의미**: “기반 완료”는 해당 단계의 좁은 기술 계약과 자동 검사가 통과했다는 뜻이지, 게임 기능 전체가 완성됐다는 뜻이 아니다. `main`에 병합된 상태도 아니다.

## PR 및 브랜치 의존 관계
모두 사용자 승인 전까지 Draft / 미병합으로 취급한다. GitHub에서 현재 상태가 바뀌면 갱신한다.

| PR | head | base | 역할 |
| --- | --- | --- | --- |
| #32 | `integration/00-stabilization-20261023` | `feat/global-clock-v3-saves` | 구 작업 통합 시작 |
| #33 | `feat/03c-runtime-integration` | `integration/00-stabilization-20261023` | 런타임 통합 |
| #34 | `feat/03c-completion-windows` | #33 | 03-C 보강 |
| #35 | `feat/03d-generators-foundation` | #34 | 생성기 기반 |
| #36 | `feat/03d-completion` | #35 | 생성 보강 |
| #37 | `feat/region-activity-realignment` | #36 | 지역 활동 정렬 |
| #38 | `feat/03e-world-persistence` | #37 | 세계 영속화 |
| #39 | `feat/03f-integration-stability` | #38 | 통합 안정화 |
| #40 | `feat/04a-progression-foundation` | #39 | 성장 |
| #41 | `feat/04b-origin-and-body-size` | #40 | 출신·크기 |
| #42 | `feat/04c-background-interactions` | #41 | 배경 정보 행동 |
| #43 | `feat/04d-save-progression-hardening` | #42 | 저장 검증 |
| 문서 PR | `docs/roadmap-status-20261024` | #43 | 이 현황·로드맵 문서 |

PR의 개별 상태 확인: [#39](https://github.com/KK0NGCHI/fantasy-life-sim/pull/39), [#40](https://github.com/KK0NGCHI/fantasy-life-sim/pull/40), [#41](https://github.com/KK0NGCHI/fantasy-life-sim/pull/41), [#42](https://github.com/KK0NGCHI/fantasy-life-sim/pull/42), [#43](https://github.com/KK0NGCHI/fantasy-life-sim/pull/43).

**병합 금지**: 사용자 명시적 승인 없는 `main` 병합, 리베이스/강제 푸시, 저장 DB 스키마 변경, 기존 세이브 덮어쓰기는 하지 않는다. GitHub의 stacked PR은 아래 계층의 검토·검사가 함께 필요하므로 병합 전 전체 체인 상태를 다시 확인한다.

## 현재 기술상의 알려진 격차
1. 실제 채집·낚시·벌목·채광 자원 노드/드롭/소진·회복/월드 Delta와 저장 연동 없음.
2. 제작 UI와 제작법 표시가 실제 경제·재료 소비·품질·결과 아이템 루프를 보장하지 않는다.
3. 생활·전투·제작 숙련 XP는 실세계 결과가 검증될 때 연결. 버튼 클릭만으로 지급 금지.
4. 배경 고유 ID와 16종 정보 행동은 존재하지만 전문 배경 보상은 후속 시스템에 맡긴다.
5. save v3의 성장/출신 검증은 완료. 구 저장 이전 후보는 **메모리 내 복사 준비**만 가능하며 실제 새 슬롯 저장/승인 UI는 아직 없다.
6. 지도/월드의 진짜 오브젝트 변경과 기존 저장 마이그레이션, 사용자 Windows 브라우저 직접 검수는 별도.
7. 기존 화면에 목업 골드·일부 아이템·상태·제작 수치가 남을 수 있다. 실제 게임 보상이라고 문서화하지 않는다.
8. 04-A/04-B의 수치·종족 특성·배경 보너스, 심층 필드 10/10 조건은 밸런스 **시험안**이지 모두 최종 확정값이 아니다.

## 현행 개발·검증 절차 (Windows PowerShell)
```powershell
git fetch origin
git switch docs/roadmap-status-20261024
git pull --ff-only
npm install
npm run check
py -m http.server 8000
```
`py`가 없으면 `python -m http.server 8000`. 브라우저에서 http://localhost:8000/ 확인, 오래된 화면은 Ctrl+Shift+R.
**잠금 파일이 없으므로 `npm ci`를 사용하지 말 것.** 과거 단계 문서에 적힌 `npm ci` 안내보다 이 지침이 우선한다.

검수는 Linux 엔진 테스트 / Windows Node smoke / Linux headless Chromium 실제 브라우저 / 사람이 하는 Windows Chrome·Edge 검수로 구분한다. CI 성공으로 마지막 항목을 완료 처리하지 않는다.

## 연결 문서
- [확정 결정·시험안 구분](./project-decisions-current.md)
- [차기 개발 로드맵](./roadmap-next.md)
- [03-D 지역 활동](./03d-region-activity-design.md)
- [03-E 세계 저장](./03e-world-persistence.md)
- [03-F 검수](./03f-integration-acceptance.md)
- [04-A 성장](./04a-progression-foundation.md)
- [04-B 종족·신체](./04b-origin-size-design.md)
- [04-C 배경 행동](./04c-exclusive-background-interactions.md)
- [04-D 저장 호환](./04d-growth-save-acceptance.md)
