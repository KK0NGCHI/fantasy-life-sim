# 03-A — 세부 검증 마무리 및 단계 인수인계

2026-10-22 · 후속 PR #23 (기반 PR #22) · Windows PowerShell 기준.

## 03-A에서 구현한 것
- 16개 주요 지역에 대한 고유 ID, 장소/지도/지형/광역 연결 레지스트리
- 세부 참조, 타일, 좌표, 필드 수명 및 결정적 생성 시드 검증
- **광역 접근성**: 초기 장소에서 공개 지역 각각에 도달하는지 유향 그래프를 검사. one-way route 반영
- **로컬 출입구**: 각 층에 입구를 요구하고, 연결된 포털이 상호 왕복 링크인지, 입구가 통행 가능 타일인지, 한 층의 입구끼리 통행 가능한지 검사
- **세계 진행 저장 사전 검사**: `WorldRuntime03A`의 버전·ID·좌표·발견 상태·방문 셀·필드 수명을 검사하고, 유효할 때만 깊은 복사본 제공. 이 사전 검사는 게임 상태나 IndexedDB를 변경하지 않음
- 플레이어 위치와 게임 전체 RNG를 변경하지 않고 장소 생성 시드 도출

## 정확한 경계
- 5×5 지도와 16개 연결은 초기 fixture. 개별 사이트의 입구는 현재 **자기 자신으로 돌아오는 시험용 링크**다. 완성된 필드 간 포털이나 실제 층 이동 구현이 아니다.
- 일반 지도 파일, 랜덤 장소 생성기, 경로 탐색, 시야/탐험 업데이트, v2 메인 UI 행동 통합은 아직 구현하지 않았다.
- v2 저장 봉투는 변경하지 않았고, `WorldRuntime03A`는 **독립 preflight**로만 제공한다. 실제 v2 세이브에 세계 상태를 넣는 저장 통합 및 구세이브 마이그레이션은 03-E의 명시적 버전 전환에서 시행한다.
- Delta와 생성된 장소 payload는 현재 미정이므로 site 참조만 검사하며 **내부 구조를 완전히 검증하지 않는다**. 이것을 출시 가능한 영속 스키마로 간주하지 않는다.
- 유저가 확정한 무게 제외·아이템 삭제 소멸·임시 필드 점유 보호 유지.

## Windows 테스트
```powershell
git fetch origin
git switch feat/03a-world-contract-finalization
git pull --ff-only
npm install
npm run check
```
성공 기준: TypeScript, 기존 엔진/UI 회귀와 `tests/world-03a*.test.mjs` 모두 통과.

## 다음 단계
- **03-B**: 광역 경로 탐색·경로 시간 및 이동 진행·세계 지도 UI. 현재 fixture 그래프를 실제 기획된 지리 연결로 대체.
- **03-C**: 로컬 4방향 이동·계단/입구 양방향 전환·안개·자동 경로 위험 회피.
- **03-D**: 버전 고정된 시드 생성과 유효성 검사.
- **03-E**: Delta·발견 상태·만료·새 월드 상태를 포함한 정식 저장 통합과 구 버전의 비파괴 이전.

레퍼런스: [CDDA 좌표계](https://docs.cataclysmdda.org/c%2B%2B/POINTS_COORDINATES.html), [Elin Zone](https://elin-modding-resources.github.io/Elin.Docs/articles/10_Source%20Sheets/zone).
