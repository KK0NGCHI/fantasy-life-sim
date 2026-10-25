# 03-E — 세계 시드·생성 지도·발견·Delta 저장 계약

2026-10-24. Draft PR #38, based on `feat/region-activity-realignment` (#37).

## 웹 레퍼런스
- Godot 공식 게임 저장 가이드: 유지할 대상 선정, 직렬화, 원본 복원 시 순서 관리. https://docs.godotengine.org/en/4.4/tutorials/io/saving_games.html
- MDN IndexedDB 트랜잭션: 읽기/쓰기와 버전 변경 트랜잭션의 분리. 기존 DB 업그레이드 없이 v3의 검증된 저장 경로를 재사용. https://developer.mozilla.org/en-US/docs/Web/API/IDBTransaction
- Minecraft 월드 시드: 시드만 같아도 생성기 버전이 달라지면 지형이 달라질 수 있음. 방문 지형 스냅샷을 영속해야 함. https://minecraft.wiki/w/Seed_(world_generation)

## 구현
1. `WorldSnapshot03E(version:1)`: 03-A 월드 상태, 사이트/층별 생성 `MapDefinition` 스냅샷, 사이트별 변경 `deltas`.
2. 최초 생성 시 `worldSeed`를 1회 결정하고 별도 장소 난수로 03-D 생성물을 생성. 신규 UI 게임에 대해 opt-in `worldPersistence03E:true` 사용.
3. 스냅샷 안의 생성 지도를 검증한 후에만 생성 결과를 추가, 같은 mapId 덮어쓰기 거부. 발견/방문 상태 및 가시 타일은 엔진 디스패치 후 단조 누적.
4. 변경 사항은 검증된 siteId/key/value와 함께 불변 Delta로 기록; 현재 실제 자원·문·몬스터에 대한 Delta 소비 동작은 후속 시스템.
5. v3 저장 봉투에 선택적 `world.runtime.world03E`가 있으면 엄격히 검증. **없는 기존 v3 데이터는 자동 이전하지 않음**. v2 세이브/IndexedDB 파일명·버전·스키마 변경 없음.
6. 저장 복원 전 온전한 스냅샷과 현재 플레이어 위치를 검증한 다음에만 live state 및 로컬 레지스트리를 교체.
7. 기존 03-D 미리보기 시드의 저장이 **던전 안**에서 만들어졌고 월드 스냅샷이 없는 경우, 모호한 새 지형에 조용히 복원하지 않고 오류 후 원본을 유지한다. 이런 슬롯은 별도 이전 절차가 필요하다.

## 미구현 범위
- 03-E 시드와 생성 지도 스냅샷의 기본 영속화를 구현했으나, 역사적 던전 세이브에 대한 UI 승인형 마이그레이션, 전체 현장 오브젝트 Delta 실행, 재생/임시 사이트 수명 및 후속 세계관 인카운터는 별도 작업.
- 광산은 field, 깊은 숲·심층 광산·심해는 **타일이 없는 활동 구역**. 해당 구역에 타일 지도를 자동 생성하지 않는다.
- Windows 브라우저에서 UI 직접 저장·복원 검수는 아직 미수행. 자동 테스트만으로 완료 판단하지 않는다.

## Windows PowerShell
```powershell
git fetch origin
git switch feat/03e-world-persistence
git pull --ff-only
npm ci
npm run check
py -m http.server 8000
```
`py`가 없으면 `python -m http.server 8000`. Chrome/Edge에서 http://localhost:8000/ 로 이동 후 Ctrl+Shift+R. 브라우저 사용 중 F5(게임 내 저장)와 F9(불러오기)를 기존 동작에 맞춰 검수.

## QA
1. 새 게임에서 던전 진입, 몇 칸 이동 후 F5로 저장. 새로고침과 F9로 복원하면 현재 좌표·층·발견 셀·게임 시간·시드가 동일해야 한다.
2. 이미 방문한 생성 지도는 저장 이후 같은 타일 배열을 가져야 한다.
3. v3 원본 슬롯(스냅샷 없음)은 자동 변환되지 않는다. 과거 던전 중 저장은 명시적으로 거절해 원본을 남긴다.
4. 임의로 생성 지도/방문 셀을 변조한 파일은 복원되지 않고 현재 live state가 유지된다.
5. Chrome/Edge 콘솔 오류, 저장 충돌, 자동저장 슬롯, 외부 백업도 확인한다.

## 다음 점검
- 정식 v3 내부 월드 필드 계약 공개 여부와 향후 `saveVersion:4` 이전 필요성 평가.
- 사이트별 Delta가 실제 채집/문/장애물의 단일 정본에서 재현되는지 확인.
- 생성기 업데이트 간 호환용 형식·버전 분리 검증.
