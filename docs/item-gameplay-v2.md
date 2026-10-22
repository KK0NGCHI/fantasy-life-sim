# 정식 v2 아이템 행동 엔진 — 구현 범위와 규칙

## 완료된 엔진 통합
- `GameStateV2`를 직접 입력·출력으로 사용하는 `dispatchItemAction` 추가. v1 `GameState`로의 다운캐스트/침묵 변환 없음.
- 02-A의 `ItemRegistry`와 `validateItemWorld`, 02-B의 `createSaveV2`와 그대로 연계.
- 성공·게임 규칙상 실패: 1턴. 기술적으로 잘못된 명령: 0턴. 아이템 조작은 새로운 상태 객체로만 반영.
- 소유: 플레이어 인벤토리와 장비, 플레이어가 소유한 중첩 용기의 아이템까지 행동 가능. 타인 소유·월드 아이템은 별도 콘텐츠 행동 전까지 제외.
- `item.move`: 인벤토리/장비/소유 컨테이너 이동. 장비는 `equip` capability가 필요하고 같은 장비 슬롯 중복 점유 거부. 컨테이너에 넣으려면 `storage` capability가 있어야 하며, 순환 컨테이너 생성은 거부.
- `item.consume`: `eat` capability 아이템에 한해 명시한 양만 감소. 수량이 0이면 인스턴스·배치·컨테이너 참조 제거. **HP·허기 회복량 등 아이템 효과는 아직 연결하지 않음.**
- `item.merge`: 소유한 동일 속성 스택만 병합. 컨테이너 본체는 병합하지 않음. 안전 정수 초과 차단.
- `item.split`: 지정 수량을 새 인스턴스 ID로 분할. 고유 특성은 보존, 위치를 공유. 자동 ID 할당은 호출자의 책임.
- `item.craft`: 정적 `RecipeDefinition`의 OR 재료 조건/수량에 대해 **선택한 아이템**을 검사하고 소비. 결과물은 기본 인스턴스로 1개 생성. 실패한 조합은 재료를 소비하지 않음. 레시피 자체의 수율·시간 비용·품질/소재 계승·작업대 접근·숙련 요구·선택 재료의 효과는 미연결. **이 기능은 완전한 제작 게임 규칙이 아닌 기본 제작 처리기임.**

## 참고 근거
- Elin Thing Sheet (레시피 재료 ID, 소재, 카테고리, OR·선택 재료, 제작대, trait 분리):
  https://elin-modding-resources.github.io/Elin.Docs/articles/10_Source%20Sheets/thing
- Elin Material Sheet (소재 경도, 무게·가격 배율, 성능 등 별도 자료):
  https://elin-modding-resources.github.io/Elin.Docs/articles/10_Source%20Sheets/material
- Cataclysm: Dark Days Ahead ITEM JSON (container pockets and capacity constraints):
  https://github.com/CleverRaven/Cataclysm-DDA/blob/master/doc/JSON/ITEM.md

## 다음 콘텐츠 레이어에서 결정할 규칙
- 소재별 공격·방어·무게·가치 계수와 허용 소재 조합
- 제작 성공/실패 확률, 숙련, 최소·최대 턴, 스테이션, 재료·품질 계승
- 장비 슬롯의 종류, 양손 규칙, 능력치/저주 장착 제한
- 컨테이너 용량·무게 경감·아이템 개수/종류 제한
- 음식 섭취 효과·부패·신선도와 수치
- 월드의 줍기/버리기·소유권·범죄 규칙
- 유효한 스택 제한 및 자동 병합 정책

이 규칙들을 모른 채 Elin 값을 그대로 복제하지 않는다. UI와 기존 `ActionDispatcher`는 여전히 v1 프로토타입 계약으로 존재하며, 실제 화면/자동 행동과의 접합이 별도로 필요하다.

## 검증
`npm run check`: v1 회귀 + v2 스택/인벤토리/제작/브라우저 저장 코어의 타입 및 Node 검증. 브라우저 저장 검증 파일은 앞 단계에서 추가되었고 별도로 실행한다.
