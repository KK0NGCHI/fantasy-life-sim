# 03-B v1.1 — 비가시 교통로와 스킵 여행, 인카운터

설계 변경: 2026-10-22 · 기본 브랜치 `feat/03b-route-travel-engine`.

## 결정
- 4×4 지역 선택 UI 좌표는 실제 거리가 아니다. 별도로 정의한 세계관상의 교통망 간선과 그 비용이 유일한 광역 거리·소요 시간 기준.
- 목적지를 선택하면 내부적으로 경로 계산, 유효한 이동을 승인하면 자동으로 여행 시간을 스킵한다. 지역별로 수동 '1턴 진행'하지 않는다.
- 세계 RNG 스트림에서 **경로 간선 완료마다** 한 번 12% 인카운터 판정 (초기 임시 확률, 콘텐츠 설계 때 조정). 이동 중 인카운터가 발생한 구간까지의 턴과 세계 시간은 확정하고 팝업에서 멈춤.
- **이벤트 없는 여행**은 목적지까지 한 번의 게임 행동 커밋으로 이동. 빠른 경로/안전 경로/적은 턴 기준을 선택할 수 있지만 선택에 소모 턴 없음.
- 중간 팝업에서 계속/일시정지 가능. 여행 상태는 `world.runtime.travel03B`, RNG와 시간은 기존 GameStateV2에 보관.
- 인카운터는 지금 **안내형 팝업만** 제공. 전투, NPC, 보상, 별도 필드 생성은 아직 연결되지 않았다.
- 이동 중 무게·적재량·무게 페널티는 없다.

## 세계관 기반 지리적 비용
- 거점~초원(4 세계시간 단위), 거점~숲(6)
- 숲~산맥(12), 산맥~설원(18), 산맥~화산(30)
- 강·호수~해안(17), 해안~바다(24), 해안~사막(36)
- 사막~고대 유적(16), 광산~지하미궁(26) 등
이 숫자는 **03-B용 임시 세계관 거리/교통 비용**이다. 화면상 타일 인접성은 비용에 영향을 주지 않는다. 실제 단위/교통수단/기후 밸런스는 이후 콘텐츠 설계에서 결정.

## 구현
- `src/engine/world/somnium-world.ts` 명시적 다중 간선 그래프로 대체.
- `src/main-v2-inventory.js`에서 상태를 안전하게 시뮬레이션하여 RNG 인카운터까지 스킵하고, 기존 v2 dispatcher가 전체 경과 턴·시간을 정확히 한 번 적용한다.
- `src/v3.js` 세계 지도에서 '1턴 진행' 제거. 목적지 클릭/예상 비용/이동 시작, 이벤트 팝업과 계속/정지.
- `tests/world-03b.test.mjs`, `tests/main-travel-03b.test.mjs` 기획 변경에 맞춰 검증.

## 남은 검수
- 실제 Windows Chrome/Edge UI 테스트와 저장/복원 시 인카운터 팝업 재노출 UX 검수 필요.
- 인카운터 확률 조정, 적·상인·길막기 등 실제 사건 연결은 후속 단계. 세계 교통망과 운송 수단 최종 밸런스도 별도.
- 필드/사이트의 발견 상태와 만료는 기존 03-A 시험 레지스트리와의 연동을 더 엄격히 해야 함.
- PR은 선행 Draft 브랜치 위의 후속 Draft PR이며 main 병합은 별도 검토.

## Windows PowerShell
```powershell
git fetch origin
git switch feat/03b-skip-travel-encounters
git pull --ff-only
npm install
npm run check
py -m http.server 8000
```
브라우저 `http://localhost:8000/` → 세계 지도 → 거점 마을에서 사막/바다/화산의 예상 비용이 숲보다 큰지 확인 → 이동하기 → 인카운터 없으면 즉시 도착 → 이벤트 발생 시 팝업에서 계속/일시정지 → F5/F9 저장 복원.

## 레퍼런스
- Battle Brothers 월드 구조 및 도로: https://battlebrothersgame.com/blog-post-7-worldmap/
- Battle Brothers 카라반 이동 시간 스킵: https://battlebrothersgame.com/worldmap-update-0-6-0-16/
- RimWorld 카라반 경로·인카운터: https://rimworldwiki.com/wiki/Caravan
