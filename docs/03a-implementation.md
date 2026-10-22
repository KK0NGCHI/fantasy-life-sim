# 03-A 세계 데이터 구현 및 검증

2026-10-22 · PR #22 · 기존 03-A 설계 `docs/03a-world-contract.md`를 기준으로 구현.

## 구현
- `src/engine/world/world-model.ts`: 월드/16지역/장소/지형/로컬 맵/경로 타입, 전역 ID/참조/좌표/이동 비용 검증, 순수 결정적 시드 파생.
- `src/engine/world/somnium-world.ts`: 기존 16개 지역의 안정적 namespaced ID, 각 지역의 시작 장소, 5×5 **시험용 맵**, 기본 연결 그래프. 이 그래프와 맵은 게임 밸런스나 실제 완성형 세계가 아니다.
- `src/engine/world/lifecycle.ts`: 영구·자원 재생·임시 만료·던전 반복 재생. **게임 세계 시간**으로만 갱신한다. 플레이어가 들어 있거나 보호된 임시 장소는 삭제를 보류하고 퇴장 후 만료. 반복 필드의 generationIndex는 경과한 주기만큼 증가.
- 기존 world/action RNG를 소비하지 않는 장소별 초기화용 FNV형 32비트 해시. hash 프로토콜은 `JSON.stringify([worldSeed,generatorVersion,siteId,generationIndex])`를 UTF-16 코드 유닛 순회한 FNV-1a 변종이며 version을 변경하지 않은 채 공식 변경 금지.
- `src/engine/v2.ts`에서 새 API 노출.
- `tests/world-03a.test.mjs`: 중복·누락 참조·벽 좌표·시드 반복·점유 중 만료 지연·재생/반복 규칙 테스트.

## 구현 경계 및 이후 필수 작업
03-A는 **정의와 데이터 검증에 대한 첫 구현**이다. 현재는 추가 검증이 필요한 초기 코드다.
- 각 맵의 고유 entryId에 실사용 입장 좌표/쌍방 출구를 모두 부여하는 연결 계약은 03-B/03-C에서 구체화. fixture maps의 entrances는 비어 있으며 현재 레지스트리는 site.entryId를 실제 맵 출입구에 대응시켜 검증하지 않는다.
- 그래프에는 현재 16개 지역을 일렬로 연결하는 시험용 간선만 들어 있고, 사용자가 선택한 자동 경로 이동 기능은 아직 없음.
- 이미 생성된 장소의 결과/Delta 저장, discovery 상태 저장, v2 GameState.world 정식 필수 계약과 마이그레이션은 후속 통합. 아직 saveVersion을 변경하지 않았으며 구형 저장을 건드리지 않음.
- 랜덤 배치 알고리즘, 몬스터·채집 자원 생성, 세계시계 기반 자동 수명 업데이트는 별도 작업.
- 수명 갱신의 숫자(하루 몇 unit인지 등)는 콘텐츠 밸런스에서 확정. 본 구현은 unit 기반 규칙만 강제.
- 플레이어·퀘스트가 있는 장소는 만료 전에 보호. 저장된 아이템·퀘스트 자산의 처리 정책은 후속 데이터 계약에서 규정.
- 실제 Windows Chrome/Edge 브라우저 UI 검증은 이 단계의 TypeScript 순수 모델에 해당하지 않으며 03-C 이후 통합 시 진행.
- 무게 시스템 없음, 아이템 버리기 영구 삭제 정책 유지.

## Windows PowerShell
```powershell
git fetch origin
git switch feat/03a-world-registry-lifecycle
git pull --ff-only
npm install
npm run check
```

## 구현에 참고한 문서
- https://elin-modding-resources.github.io/Elin.Docs/articles/10_Source%20Sheets/zone
- https://docs.cataclysmdda.org/c%2B%2B/POINTS_COORDINATES.html
- https://docs.cataclysmdda.org/JSON/OVERMAP.html
