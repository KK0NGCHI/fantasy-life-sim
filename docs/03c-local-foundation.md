# 03-C 로컬 필드 기초 구현 — 1차 검증

2026-10-23. 기준 브랜치: `feat/global-clock-v3-saves`.

## 구현
- `local-movement.ts`: 03-A 맵 레지스트리 기반 **상하좌우 4방향** 단일 이동 계산. 좌표 범위·벽과 통행 가능 지형 검증. 대각선/무효 입력은 0턴, 실제 벽 이동 시도는 1턴·6초 소비. 이 결과를 실제 게임 시계에 적용하는 책임은 중앙 dispatcher가 담당한다.
- 알려진 지형 위험은 진입 **이전** `hazard`로 반환해 이동 중단, 미발견 위험은 자동 회피 로직에 사용하지 않는다. 현재는 위험 이벤트/피해 반영 없이 판정 API만 제공.
- `localArrival`: 월드 지도상의 4×4 UI 위치가 아닌 `SiteDefinition.entryId`에서 실제 로컬 입장 좌표 추출.
- `recordLocalVisit`: 지역 방문 상태 및 이동해 본 셀을 복사본에 기록. 현재 시야 계산/FOV가 아닌 **방문 기록**만 수행.
- 테스트: 입장 좌표, 벽, 무효 입력, 위험, 중복 방문 불변, 게임 초 단위 비용.

## 아직 이번 변경에 포함하지 않은 항목
- 현재 메인 UI의 `dungeon.move`는 별도의 기존 5×5 시험 지도를 사용한다. 03-C의 새 로컬 지도 판정은 **독립 모델**이며, 메인 UI 화면/동작과 아직 연결하지 않았다.
- 각 지역의 지형 데이터는 여전히 03-A 시험용 5×5 맵이다. 실제 지형 배치/더 넓은 필드 생성은 이후 작업.
- 여러 층, 계단 양방향 전환, 정식 시야/포그 오브 워, 로컬 자동 길찾기와 UI 검증은 **03-C 후속 작업**.
- 03-A `WorldRuntime03A`의 본격 영속 통합과 사용자 저장 이전 정책은 03-E에서 별도 검증.
- 플레이어 이동이 중앙 dispatcher에서 실제로 한번만 시간 비용을 지불하는지 통합 테스트가 필요하다.

## macOS 테스트
```bash
git fetch origin
git switch feat/03c-local-map-foundation
git pull --ff-only
npm install
npm run check
```

이번은 TypeScript 순수 모델이어서 새 브라우저 화면은 나타나지 않는다. `tests/world-03c-local.test.mjs` 확인.
참고: https://docs.cataclysmdda.org/c%2B%2B/POINTS_COORDINATES.html
