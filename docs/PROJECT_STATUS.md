# Somnium — 현재 개발 기준선

기준: 2026-10-28, `main` 3cc72222aee1f8bd5980f1d19b07db8e6fb5efd5. **M0 문서 정비 브랜치의 기준 스냅샷**이며 실시간으로 자동 갱신되는 상태표가 아니다. 새 개발은 작업 직전 GitHub HEAD·PR·CI를 재검증한다.

## 한눈에 보는 현황
- **현재 통합 목표:** M0 기준선 정리 → M1 생활·생산·경제. [상위 계획](MASTER_ROADMAP.md).
- **기술 기반:** TypeScript 행동/턴/정수 초 세계시간, 시드 난수, 세계 이동/미궁 탐색, IndexedDB v2/v3 경로, 자원/아이템/제작 및 UI. [기존 엔진 설명](engine-01a.md).
- **현재 자원·제작:** 05-A~05-N 식물·균류·수목·광물 획득/가공 일부가 실구현. 2026-10-28 Stage I 공통 제작 런타임과 헤드리스 Chromium 작업대 상호작용 자동 인수 범위가 PR #156으로 main에 반영됨. 이는 게임 전체 기능/사용자 수동 검수 완료가 아님.
- **부분 구현:** 54개 숙련과 7개 능력치, 종족 8개·배경 16개 *후보*, 16개 광역 지역, 미궁 타일 탐색, 자원 카탈로그 일부, 성장 XP 일부.
- **핵심 미완성:** 농사→요리→판매→재투자, 거점 기능, 실전 전투·회복·사망, 신앙의 실질 보상/금기 반응, 상인·경제, 포획/목축, 심해/수생 전반, 전 범위 수동 QA/밸런스. UI에 표시되는 목업 수치는 실게임 보상과 구분.
- **열린 PR:** 2026-10-28 조회 시 #125 (Draft, herbal fiber glove recipe). 최신 main과 중복·재현 여부를 먼저 확인하고 사용자 승인 없이 병합하지 않음.
- **CI:** 2026-10-28 최근 `9bc8a270`의 Engine 01-A / Prototype checks 성공 확인. 기준 HEAD `3cc7222`의 모든 플랫폼 체크가 성공했다는 증거로 확대 해석하지 않음.
- **로컬 확인:** 이번 M0 수행 환경은 GitHub 도메인 해석 실패로 clone / npm install / npm run check / 실제 브라우저 실행 불가. **로컬 직접 검사는 미실시, Windows 사용자 수동 QA 미실시.** PR #157 커밋 `b0ddb5e` 대상 GitHub Actions의 Prototype checks (syntax), Engine 01-A (engine/windows-smoke/browser-chromium)는 모두 성공. 이후 실행계획서 문서 추가 커밋의 CI는 별도 확인한다.

## 권위 있는 문서 진입점
1. [MASTER_ROADMAP](MASTER_ROADMAP.md) — M0~M5 개발 목표/완료 기준.
2. [DECISIONS_AND_CONFLICTS](DECISIONS_AND_CONFLICTS.md) — 확정 규칙, 시험값, 구현 충돌.
3. 이 문서 — 실제 코드 및 검증 상태.
4. [자원·제작 세부 로드맵](resource-crafting-roadmap-v2-consolidated.md) — M1/M4 영역별 기술 참고. **전체 프로젝트 최상위 단계 아님.**
5. [과거 상태](project-status-current.md), [과거 개발 로드맵](roadmap-next.md), [안정화 이력](stabilization-tracks-current.md) — 작성 시점의 기록. 최신 구현 판단 우선 근거 아님.

## 실행 경로와 소유 경계
```text
index.html -> src/v3.js (활성 UI; v10.css, v3.js)
           -> src/main-v2-inventory.js (현재 JS 통합 브리지)
           -> dist/engine/v2.js (tsc가 생성하는 엔진 배포 산출물)
           -> src/engine/core/{v2-dispatch,v3-dispatch}.ts
           -> src/engine/world/* / src/engine/data/item-world.ts
           -> src/engine/save/{save-v3,indexeddb-v3}.ts
src/v3.js -> src/crafting-preflight-stage1.js / crafting-workshop-stage1.js
          -> src/material-compatibility-05j.js / material-composition-05n.js
          -> src/mineral-refining-05h.js 및 활성 제작법
자원 → resources-05a/resource-sites-05a, botanical/fungal, mineral-deposits-05e
     → src/main-v2-inventory.js → 소유자 범위 지급/소비 → 엔진 상태 및 save v3
```
- 위 경로는 소스 import 및 현재 등록 모듈에서 확인한 **구성도**다. 모든 명령의 실제 런타임 도달 여부를 빠짐없이 계측한 결과가 아니며, 고전 버전 파일은 미사용 확인 전 삭제하지 않는다.
- `src/app.js`, `v2.js`, 구 `v*.css`는 역사/회귀 목적이 포함된다. `index.html`의 활성 JS는 `src/v3.js`. `src/v3.js`에서 `mock:` 아이템과 `STATUS_MOCK`이 확인되므로 해당 UI 데이터는 실제 보상으로 취급하지 않는다.
- 개발 시 정적 콘텐츠 정의/인스턴스 구분, 공통 디스패처의 시간·턴, 원자적 지급/소비, v3 저장 및 구버전 원본 보호를 필수 유지.

## 콘텐츠 상태 원장 — 숫자 대신 단계별 증거
| 상태 | 증거 조건 | 현행 판정 |
|---|---|---|
| candidate | 단순 후보 정의/설계표 | 348개 원천/539개 산출물 등 과거 기획 수치 존재; **현행 실측 아님** |
| approved | 세계관/실재종 및 데이터 검토 승인 기록 | 집계 미확인 |
| discoverable | 실제 플레이의 발견 경로 존재 | 일부 05-A/05-E 등 확인; 집계 미확인 |
| obtainable | 소유 재고에 실제 획득 | 일부 확인; 집계 미확인 |
| processable | 실제 가공 가능한 등록식과 실행 경로 | 일부 확인; 집계 미확인 |
| useful | 소비/제작/연구/도감/장비 등 실제 용도 | 일부 확인; 집계 미확인 |
| ui-tested | 브라우저 실제 UI 상호작용 회귀 | Stage I 공통 작업대 범위만 자동 수용 |
| save-tested | 해당 개체/규칙의 v3 왕복 검증 | 일부 자원·제작 범위만 확인 |

**M1 계측 과제:** 상태는 누적 단일 점수로 합치지 않고, ID당 증거(테스트·명령·UI·저장)가 있는지 기계적으로 집계한다. `approved` 없이 기획 후보를 자동 활성화하지 않는다.

## 재확인할 위험
- [충돌 원장](DECISIONS_AND_CONFLICTS.md)의 C-01 칼두르 제작 금기 사전 거부와 세계관상의 의도적 위반 허용 충돌.
- v3 브리지가 v2 형태로 변환하는 층, 활성 UI 목업/실제 경계, `dist/` 빌드 필요 여부.
- 제작 시 생존 기본 초당 감소율은 **0**이고 명시적 감소량 중단만 구현. 자연 감소까지 완료했다고 표현하지 않음.
- 유저 Windows Chrome/Edge 수동 검수, 실제 장시간 플레이 검증은 별도.
