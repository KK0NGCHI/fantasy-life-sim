# 아이템 데이터와 저장 통합 — v2

## 레퍼런스
- Elin Thing/Material/Element: 아이템 원형·소재·효과를 분리. Elin Thing의 `quality`는 희귀도 단계이지만 Somnium은 **품질/희귀도/강화도 분리**를 유지.
  - https://elin-modding-resources.github.io/Elin.Docs/articles/10_Source%20Sheets/thing
  - https://elin-modding-resources.github.io/Elin.Docs/articles/10_Source%20Sheets/material
- Cataclysm DDA: 아이템 원형과 특수 subtype, 가변 아이템 상태, 포켓/용기별 제약 분리.
  - https://docs.cataclysmdda.org/JSON/ITEM.html

## 확정 계약
- `ItemDefinition` + `MaterialDefinition` + `EffectDefinition` + `RecipeDefinition`: 정적 정의. 실제 속성/레시피 수치는 콘텐츠에서 결정.
- `ItemInstanceDraft`: 개별 ID, 종류 참조, 수량, 선택적 소재, 독립 품질/희귀도/강화도, 개별 효과 및 컨디션. 중첩은 ID·수량 외 상태가 동일한 경우만 허용.
- `ItemWorldSnapshot`: 개별 아이템, 그 위치(플레이어/장비/컨테이너/월드), 컨테이너 내 아이템 참조의 단일 진실 공급원. 중복 배치·순환 참조 거부.
- `GameStateV2`: 기존 `inventory` 대신 `itemWorld` 하나만 저장. `schemaVersion:2`. 시간/RNG/플레이어/세계/진행도는 동일한 의미로 유지.
- `SaveEnvelopeV2`: 저장 봉투 `saveVersion:2`; 아이템 검증에 콘텐츠 레지스트리가 반드시 필요. `createSaveV2`, `decodeSaveV2`, `parseBackupV2`, `exportBackupV2` 모두 별도 API.
- `IndexedDbSavesV2`: 콘텐츠 레지스트리를 생성 시 주입하며, v2 전용 DB에서 저장·로드·복구 후보를 검증. 기존 `IndexedDbSaves`/v1 DB는 유지.
- 명시적 `migrateV1ToV2`: 구형 인벤토리 아이템을 플레이어 소유로 배치해 변환. 구형 데이터로부터 품질/소재/인챈트를 **추측하여 만들지 않음**; 미등록 정의는 거부. 호출자 상태는 불변.
- v1 저장물을 조용히 v2로 해석하지 않음. 모든 변환과 새 DB 기록은 사용자 승인·사전 백업 경로를 거쳐야 함.

## 정해지지 않은 게임 규칙
장비 슬롯 목록, 아이템 내구도 공식, 소재별 수치, 인챈트 효과, 품질 단계, 레시피 결과 계산, 용기 수용량/무게 제한, 음식 부패 공식, 새로운 아이템을 자동 중첩할 대상 선정.

**기술 계약 완성과 게임 콘텐츠 완성은 다르다.** 본 구현은 v2 데이터 직렬화/참조 무결성/복원 경계를 정하지만, 실제 게임 UI는 여전히 v1 프로토타입이며 v2 액션 핸들러/브라우저 파일 UX는 연동되지 않았다. 실제 마이그레이션은 인게임 전환 UI와 사용자 확인이 구현되어야 실행한다.

## 테스트
`npm run check` — v1 호환성 테스트 + v2 속성 및 아이템 컨테이너 왕복 + 손상 데이터 거부 + 비파괴 변환.

## v2 브라우저 통합 검사

```bash
git fetch origin
git switch feat/02-item-schema-v2-persistence
npm run check
python3 -m http.server 8000
```

`http://localhost:8000/tests/browser-items-v2.html`에서 **검증 실행**을 클릭한다. 사용자 DB와 완전히 분리된 임시 IndexedDB로 v2의 상세 아이템 상태·컨테이너·RNG 재열기 복원, 두 번째 revision, 이전 버전 보존, 미등록 소재 거부, 오래된 revision 충돌 방지를 검사한다.

이 파일은 수동 실브라우저 검증이며 CI가 자동 실행하지 않는다. 완료되었다고 주장하려면 브라우저 결과를 확인해야 한다.
