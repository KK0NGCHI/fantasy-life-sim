# Somnium 글로벌 시간·v3 저장 — 구현 및 Mac 검증

2026-10-23 · 작업 브랜치 `feat/global-clock-v3-saves` · Draft PR #28

## 구현 계약
- 1 세계 시간 단위 = 게임 내 1초. 시작 시각: 1일차 08:00. `gameClockAt`은 누적 초에서 날짜/시/분/초 파생.
- 행동 턴은 논리적 처리 수, 시계와 독립. `action-seconds.ts`에 메인 UI에서 쓰는 행동별 첫 버전 시간을 중앙화. 밸런스 값은 향후 조정 가능.
- 광역 여행은 실제 초 단위 경로 시간을 스킵. 사건 발생 지점까지의 시간/턴 및 RNG를 확정하고, 팝업 후 나머지 이동 재개.
- 16개 주요 지역은 모두 영구 앵커. 초원의 자원 재생은 86,400초(하루), 반복 미궁은 259,200초(3일) 시험 값. **일반 생성형 임시 필드의 콘텐츠/재생 실행은 이후 03-D~03-E.**
- v3 save envelope는 `saveVersion:3`, `schemaVersion:3`, `clock:{elapsedSeconds,calendarId:'somnium-calendar-v1',startSecondOfDay:28800}`로 검증. 기존 item/RNG/region/턴 정합성도 기존 v2 검사 재사용.
- 신규 수동/퀵/자동 세이브는 별도 `somnium-main-v3` IndexedDB로 저장. v2의 `somnium-main-v2`는 원본 삭제/변경 없이 읽기만.
- 저장 관리자에 v2/v3 슬롯을 모두 표시. v2 불러오기는 별도의 **시간 이전 승인**이 필요하고 새로운 `migrated-UUID` v3 슬롯을 만들며 원본을 유지.
- 기존 v2 중 `timeBasis:'seconds-v1'`이면 경과 초 보존. 표시 없는 구형 v2는 경과 단위가 미정이므로 사용자 승인 시 시계를 첫날 08:00으로 초기화. 진행 중 여행·시간에 민감한 월드 델타가 있으면 자동 이전 거부.
- v3 백업은 엄격 검증·JSON roundtrip·미래 버전 거부. 기존 v2 백업도 검증 후 위와 같은 이전 확인 창으로 진행.
- **메인 동작 엔진은 아직 v2 dispatcher와 검증된 v3↔v2 변환 어댑터를 사용**. 새 게임·새 세이브는 v3 형식이나 정식 전면 엔진 타입/명명 전환은 별도 리팩터링 가능.
- 무게 시스템 없음. 버린 아이템 영구 소멸 규칙 유지.

## Mac 검증
프로젝트 저장소에서 터미널 실행:
```bash
git fetch origin
git switch feat/global-clock-v3-saves
git pull --ff-only
npm install
npm run check
python3 -m http.server 8000
```
브라우저: http://localhost:8000/ (Chrome 또는 Safari). 기존 리소스가 캐시되면 Cmd+Shift+R.

검수 순서:
1. 새 게임에서 상단 시계 오전 08:00 확인.
2. 세계 지도에서 숲까지 예상 25분, 이동 완료 후 시·분 경과 확인(인카운터가 없을 때).
3. 생활 행동 1회 후 초 단위 60초 경과/1턴 증가 검증; 인벤토리·지도만 열었을 때 0턴/0초 확인.
4. 저장 관리자에서 새 v3 슬롯 생성. 슬롯 목록에 v3 표기, JSON 백업에서 `saveVersion:3`, `clock.elapsedSeconds` 확인.
5. F5 저장 → 페이지 새로고침 → F9 로드 → 현재 시간·아이템·RNG·지역 유지 확인.
6. 과거 v2 슬롯이 목록에 남는지 확인. v2 클릭 시 즉시 덮어쓰지 않고 명시적인 초기화/새 슬롯 복제 경고 후에만 이전; 취소 시 상태·원본 유지 확인.
7. 같은 v2 백업을 별도 JSON 파일로 내보내기 후 가져오기 → 이전 승인·복원 및 원본 보호 확인.
8. 인카운터 팝업에서 중단/재개 및 초 단위 경과 검증. 여행 도중 저장/새로고침 후 이어서 진행.
9. 잘못된 JSON/미래 버전은 거부. 기존 v2 스냅샷 변경 없음.

## 알려진 범위/릴리스 게이트
- 코드 CI와 Mac 실제 브라우저 검수는 별개. 브라우저 테스트 전에는 런타임 UI 정상임을 선언하지 않는다.
- 현재 마이그레이션은 구형 v2 저장의 **의미 없는 추상 시간에 대한 안전한 재기준화**이며, 과거 정확한 일자/시각을 복원하는 기능이 아니다.
- 실제 교통수단, 날씨, 시즌, 퀘스트 진행 시간과 맵/필드 데이터의 본격 시뮬레이션은 이후 단계.
- 저장은 원자적 IndexedDB 트랜잭션으로 처리하지만, 브라우저 삭제/스토리지 손실 가능성을 위해 JSON 외부 백업을 유지한다.
- 무게·적재량 없음.

## 참고
- https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB
- https://developer.mozilla.org/en-US/docs/Web/API/IDBDatabase/transaction
- https://developer.mozilla.org/en-US/docs/Web/API/Window/structuredClone
