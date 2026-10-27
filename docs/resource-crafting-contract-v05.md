# Somnium 재료 호환·속성 전승·제작 계약 v0.5

> 2026-10-27. **기획 데이터와 구현 계약의 구분**. 마스터 384개 지역 배치, 잠정 원천 356개, 부위 후보 539개, 제작/가공 후보 56개. 숫자는 최종 세계관 확정 종수를 뜻하지 않는다.

## 정의 계층
- SourceDefinition: sourceId, name, kind (species/deposit/site/artifact/observation), regions, sacredStatus, originClass. 하나의 종은 여러 지역에 나올 수 있다. 광상과 그 속 광물종은 다른 개체이다.
- ItemDefinition: itemDefinitionId, sourceId, part, family, form, grade, propertyTags, processSuitability, foodSafety. 종과 부위가 같더라도 구체적 형태/가공 과정이 다르면 별도 정의 가능.
- ItemInstance: id, definitionId, quantity, provenance, properties, materialManifest. 재료 이력이 다른 물건을 손실성 병합하지 않는다.
- RecipeDefinition: id, station, ingredients(slotId, quantity, exactId 또는 family/form/grade/requiredTraits/excludedTraits/originRestrictions, role), outputs, duration, propertyPolicy.
- ProcessDefinition: processId, transformation(keep/reduce/convert/remove), requiredStation, validatedInputs.

## 판정 순서
1. 입력 슬롯에서 정확 ID 또는 범용 조건을 판정한다. 범용은 family, form, grade, requiredTraits, excludedTraits, 출처 제한을 모두 만족해야 한다.
2. 실제 인스턴스의 가용 수량을 슬롯 간 선점·합산한다. 동일 재고를 중복 소비하지 않는다.
3. 조건과 설비/지역 충족 시 재료 소비·완성품 생성은 하나의 원자적 상태 전환으로 실행한다. 유효하지 않은 명령은 0턴·0시간·0재료 소비.
4. 완성품에는 출처, 재료 비율, 역할별 성질을 기록한다. 기본 정의는 동일하지만 재료 조성이 다르면 개별 인스턴스로 구분할 수 있어야 한다.
5. 재료 역할: structural/functional/binding/decorative/conduit. 공정별 keep/reduce/convert/remove를 지정하고 의미가 없는 속성은 자동 전승하지 않는다.

## 공정 예시
| 입력 | 공정 | 결과 |
|---|---|---|
| 참나무 통나무 | 판재 가공 | 수종과 구조 성질 보존, 단순 가공성만 변환 |
| 참나무 통나무 | 탄화 | 연료 특성으로 변환, 휘발성 향 특성 소멸 가능 |
| 아마 줄기 | 방적 | 섬유 분리, 실로 변환. 발광/몽환 특성은 자동 전승하지 않음 |
| 황동석 | 선광·제련 | 구리 원료화 후 주괴. 광물종 이력 유지, 구형 05-H 광물 원장 중복 지급 금지 |
| 먹물 | 안료 정제 | 색소만 적절히 전승 |
| 이질적 광물 | 표본 봉인 | 이질 출처 기록 유지, 장비 제작으로 판정하지 않음 |

## 저장과 호환
- 구형 save v3를 무단 덮어쓰거나 자동 마이그레이션하지 않는다. manifest 도입에는 명시적 검증·이전·구형 슬롯 보호가 필수다.
- 수동/자동 제작은 동일 판정기를 사용한다. 거절/실패/취소의 턴·시간·재고 규칙은 기존 엔진의 accepted-action 계약을 따른다.
- 보호종 관찰 등은 아이템 없이 도감 이벤트만 제공 가능하다. 음식은 인벤토리에서 부패하지 않고 밭 방치 작물의 과숙 부패와 별개다.
- 동물 일반 생산물 정확히 우유/고기/가죽/양털/알 5종, 식성 4종(골렘 잡식, 이질식 전용 사료 하나).
- 베르단: 신성 수목 벌목, 네레이아: 신성 수생 포획/살해, 칼두르: 이질적 기원 소재로 장비 제작의 금기. 일상 연구/일반 자연물/공허 속성 자체에 잘못 확대 금지.

## 테스트 승인 게이트
- 모든 sourceId가 마스터에 있고 384행 지역이 정확히 16 기본 지역에 속하는지.
- 539개 부위별 항목이 중복·관찰-only/물리 산물을 올바르게 구분하는지(현재 자동 분할은 잠정).
- 모든 제작법의 입력이 실제로 가용한 경로 또는 향후 구현 예정으로 분류되어 있는지.
- 장비 이력·속성 혼합, 두 슬롯 동일 재료 과소비 방지, 실패 원자성, 저장/로드 및 자동/수동 동일 결과 회귀 검사.
- 현실종 독성/식용 검증과 판타지 이름·성질 승인은 세계관 검토 후 확정. 제작 시간·수량은 시험값이며 경제 최적화 수치가 아님.

[마스터 TSV](./resource-master-v05.tsv) / [관계표](./resource-edges-v05.tsv) / [부위 후보](./resource-item-parts-v05.tsv) / [제작법](./resource-recipes-v05.tsv) / [연결표](./resource-recipe-mapping-v05.tsv)
