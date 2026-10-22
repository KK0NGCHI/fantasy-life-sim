# Somnium 03-A — 세계 데이터 계약 v1.0 (구현 전 설계)

확정 기준: 2026-10-22. 단계: **설계 확정 / 코드 미구현**.

## 0. 불변 결정
1. 광역: **그래프 기반 경로 이동**; 목적지 도착 후 **로컬 타일 자유 탐색**.
2. 핵심 지역 및 필수 경로 **고정**; 일반 필드·선택 장소는 **시드 기반 변주**.
3. 16개 주요 지역의 존재와 기본 위치는 **초기부터 공개**; 세부 장소는 발견해야 목록·내용 공개.
4. UI 열람/선택은 시간 0, 승인된 게임 행동에서만 턴·세계 시간을 변화.
5. 게임 내 이동 실패는 1턴, 무효 입력은 0턴. 모든 명령은 기존 v2 dispatcher 통해 처리.
6. 버린 아이템 영구 삭제; **무게와 무게 페널티 없음**.
7. 기존 v2 세이브는 손대지 않으며, 새 필드가 필수로 변경되면 **명시적 저장 마이그레이션 및 버전 상승**.

## 1. 데이터 계층과 식별자
- `WorldDefinition` : 하나의 정적 게임 세계와 16개 `RegionDefinition`, `RouteDefinition` 집합.
- `RegionDefinition` : `regionId` · `nameKey` · `biomeId` · 고정 `worldPoint` · `siteIds`. 이름/화면 좌표는 ID와 분리.
- `SiteDefinition` : `siteId` · `regionId` · `siteType` · `generationMode: 'fixed' | 'seeded'` · `templateId` · `floorIds` · `entryId`. 랜덤 배치 사이트는 worldSeed + generatorVersion + parent site + index 로 결정적 인스턴스 ID 부여. 이미 만들어진 ID는 재생성으로 변경 불가.
- `MapDefinition` : `mapId`(siteId/floorId 결합) · `width` · `height` · `tiles` · `entrances`/ `exits`. 초기 16×16은 실험치, 규격이 아님.
- `TileDefinition` : `tileId` · `traversable` · `movementCost` · `hazards` · `blocksSight`. 지형 종류와 개별 타일 상태 분리.
- 모든 ID는 namespace를 포함한 영구 문자열 (예: `core:region/forest`); **표시명/배열 인덱스를 ID로 사용 금지**.
- 정적 참조는 레지스트리에서 한번 검증; 미등록 참조나 동일 ID 중복은 오류.

## 2. 좌표계
- 광역 그래프: `regionId/siteId`가 주체, `worldPoint {x,y}`는 **표시 전용**, 거리 계산의 정본이 아님.
- 로컬 타일: `{siteId,floorId,x,y}` 정수, 원점 좌상단, x 우방향, y 아래방향, 0 ≤ x < width, 0 ≤ y < height.
- 지하 층 ID는 음수로 사용 가능하나 단순 `z` 자체가 이동 연결을 암시하지 않음. **계단·입구 링크**를 통해서만 층 변경.
- 플레이어의 단일 정본 위치: `PlayerLocation = {siteId,floorId,x,y}`; Region은 site→region 연결로 유도 (중복 시 불일치 거부).
- 외부 광역 이동 중에는 `TravelProgress {routeEdgeIds, currentEdgeIndex, ...}`를 별도 저장. 동시에 로컬 위치가 갱신된 것으로 간주하지 않음.

## 3. 광역 경로 계약
- `RouteDefinition = {edgeId,fromSiteId,toSiteId,bidirectional,baseTurns,worldTimeUnits,requirements,hazardTags}`.
- 연결되지 않은 두 장소 사이 즉시 이동 불가. 경로는 요구 조건을 만족하는 edge들만 통과.
- 03-B에서 경로 선택 정책 결정. 초기에는 **총 worldTimeUnits 최소 경로**, 동일 비용이면 edgeId 사전순으로 재현 결정. 사용자가 경로 확정 전 시간 소비 없음.
- 광역 이동은 단일 텔레포트가 아니라 **구간별 경과**를 표현하며, 부분 진행·중단·재개 상태를 저장. 각 게임 진행 단위만 dispatcher 통해 턴/시간 증가.
- 도착할 때 해당 장소의 유효한 `entryId` 좌표로 배치.
- 아직 모르는 장소를 경로 목적지로 지정 불가. 주요 지역 공개는 곧 내부 장소 전체 공개가 아님.

## 4. 탐험 정보
- 광역 지역 공개 상태: `known` (16개 기본 지역)이며, 상세 장소는 `unknown | discovered | visited`.
- 로컬 각 타일은 `unseen | remembered | currentlyVisible`. `currentlyVisible`은 **현재 시야에서 재계산되는 파생 정보**, 세이브에는 `seenCells`만 저장.
- 기억한 타일에서는 **과거 지형**을 보여도 되지만 현재 적/아이템의 갱신된 위치를 누설하지 않음.
- discovered/visited 변경은 역행하지 않음. 장기 동적 월드 변경은 별도 Delta.
- 자동 탐색은 **현재 알려진 위험만** 경로 회피; 미발견 위험 정보 사용 금지.

## 5. 생성·변화·저장
- `WorldRuntimeState = {worldSeed,generatorVersion,currentLocation,travel,discovery,generatedSites,siteDeltas}`.
- 고정 핵심 장소/통로는 template 우선. 변주 장소만 순수 결정적 generator로 생성.
- RNG: 사이트 단위 로컬 생성 시드는 `worldSeed + generatorVersion + siteId`의 명시적 안정 hash에서 파생. 플레이어 행동 RNG를 소비하지 않음. 글로벌 RNG 순서에 따른 방문 순서 차이를 방지.
- 첫 생성 시 유효한 `GeneratedSite` 결과 저장; 재방문 시 **저장된 결과와 Delta**를 사용. 생성기 업데이트에도 기존 방문 지형이 바뀌지 않음.
- Delta: 열쇠·문·자원 노드·장애물·발견 등 변한 부분만 영속. 아이템은 기존 `itemWorld`에 단일 정본 유지.
- 저장 필드 호환성: 현재 GameStateV2.world.runtime 확장은 초기 실험용. 정식 필수 세계 계약을 도입할 때 `worldStateVersion`를 부여하고, 구세이브 처리 규칙을 정의. 기존 봉투에서 같은 `saveVersion:2`를 유지하면서 새 필수 필드가 없는 데이터를 조용히 해석하는 것은 금지. 필요하면 `saveVersion:3`과 v2→v3 승인 마이그레이션으로 전환.

## 6. 검증 불변식
1. Region/Site/Map/Tile/Route ID 중복 없음, 모든 참조 대상 존재.
2. 필수 마을 ↔ 초기 필드 ↔ 필수 던전 입구 도달 가능. 각 출구에서 유효한 입구까지 이동 가능.
3. 모든 입구·계단은 접근 가능한 타일에 있고 정확히 하나의 도착 링크 지정.
4. 플레이어 위치는 정확히 한 장소/층/칸이며 도달 가능한 통행 타일.
5. 위험 지형 정책, 이동 비용은 0보다 큰 안전 정수. 무게 계산 없음.
6. 같은 (seed, generatorVersion, siteId) → 동일한 첫 생성 맵. 생성 순서가 달라도 동일.
7. 재방문·저장 왕복: 동일 발견 상태, 좌표, 생성 장소, Delta, 턴, RNG.
8. 잘못된 이동 명령 0턴; 게임 내 벽 충돌 1턴; UI 열람 0턴.
9. 자동·수동 동일 dispatch; 미발견 타일의 위험을 경로 알고리즘에 노출하지 않음.
10. 새 저장 구조로 변환 실패 시 이전 라이브 상태·슬롯 데이터는 불변.

## 7. 03-A 산출물과 경계
필수 산출물: TypeScript 타입·레지스트리·검증 함수, 16개 지역 고정 ID, 핵심 장소 샘플 5개 지역, 저장 스키마 변경 제안 및 round-trip/negative tests.

03-A **제외**: 본격 지형 생성, 경로 UI·실제 이동 동작, 전투·NPC·기후 시뮬레이션, 콘텐츠 밸런스. 이는 03-B~03-F에서 실행.

## 레퍼런스
- Elin Zone Sheet: https://elin-modding-resources.github.io/Elin.Docs/articles/10_Source%20Sheets/zone
- CDDA Coordinate Systems: https://docs.cataclysmdda.org/c%2B%2B/POINTS_COORDINATES.html
- CDDA Overmap: https://docs.cataclysmdda.org/JSON/OVERMAP.html
- Caves of Qud zone and parasang definitions: https://wiki.cavesofqud.com/wiki/Tier
