# Somnium 05-A — 야생 초본식물 80종 전체 기획표

기준 브랜치: `feat/05a-botanical-80-profiles`. 80종은 6종의 출처 연결 후보 + 74종의 잠정 종명입니다. **서식·계절·희귀도·용도·재생 주기는 Somnium 게임 디자인 제안**, 식물학적 개별 확정사항이 아닙니다. 실제 식용·의료·독성 안전성을 보증하지 않습니다.

## 기획 변수
- 채집/관찰: `observe`는 확률형 재료 획득에서 제외하며, 실제 관찰 전용 UI·도감 행동은 후속 통합 대상입니다.
- 희귀 등급은 지역/행동의 추첨 테이블에 영향을 줍니다. 시험 단계의 등급군 가중치는 일반 70, 고급 25, 희귀 5입니다. 식물별 가중치는 각 등급 안에서 1이며 시즌 조건으로 필터링됩니다.
- 재생 유형: `renewable` 반복 자원, `seasonal` 제철 복원, `slow` 느린 회복, `rain-pulse` 강우 후 단기 출현 *예정*. 이들은 현재 **실제 독립 재생 스케줄러가 아닌 메타데이터**입니다.

| # | 이름 | 학명(후보) | 지역 | 계절(게임) | 부위 | 게임 내 사용처 | 등급 | 재생 유형 | 방식 | 조사 |
|---:|---|---|---|---|---|---|---|---|---|---|
| 1 | 큰질경이 | *Plantago major* | 초원·농경지 | 봄·여름·가을 | leaf | basic-herb | common | renewable | 채집 | 개별 출처 |
| 2 | 데이지 | *Bellis perennis* | 초원·농경지 | 봄·여름 | flower | ornamental | common | renewable | 채집 | 개별 출처 |
| 3 | 서양톱풀 | *Achillea millefolium* | 초원·농경지,숲 | 여름·가을 | flower | dye-herb | uncommon | renewable | 채집 | 개별 출처 |
| 4 | 야생 마늘 | *Allium ursinum* | 숲 | 봄 | leaf | culinary-herb | uncommon | seasonal | 채집 | 개별 출처 |
| 5 | 물박하 | *Mentha aquatica* | 습지 | 여름·가을 | leaf | aromatic | common | renewable | 채집 | 개별 출처 |
| 6 | 동의나물 | *Caltha palustris* | 습지 | 봄 | flower | ornamental | uncommon | seasonal | 채집 | 개별 출처 |
| 7 | 민들레 | *Taraxacum erythrospermum* | 초원·농경지 | 봄·여름·가을 | flower | dye-herb | common | renewable | 채집 | 잠정 |
| 8 | 붉은토끼풀 | *Trifolium pratense* | 초원·농경지 | 봄·여름 | flower | forage | common | renewable | 채집 | 잠정 |
| 9 | 흰토끼풀 | *Trifolium repens* | 초원·농경지 | 봄·여름·가을 | flower | forage | common | renewable | 채집 | 잠정 |
| 10 | 냉이 | *Capsella bursa-pastoris* | 초원·농경지 | 봄·가을 | leaf | culinary-herb | common | seasonal | 채집 | 잠정 |
| 11 | 명아주 | *Chenopodium album* | 초원·농경지 | 여름·가을 | leaf | forage | common | renewable | 채집 | 잠정 |
| 12 | 큰개불알풀 | *Veronica persica* | 초원·농경지 | 봄 | flower | ornamental | common | renewable | 채집 | 잠정 |
| 13 | 개망초 | *Erigeron annuus* | 초원·농경지 | 여름·가을 | flower | dye-herb | common | renewable | 채집 | 잠정 |
| 14 | 쇠비름 | *Portulaca oleracea* | 초원·농경지 | 여름·가을 | leaf | culinary-herb | common | renewable | 채집 | 잠정 |
| 15 | 쑥 | *Artemisia princeps* | 초원·농경지 | 봄·여름·가을 | leaf | aromatic | common | renewable | 채집 | 잠정 |
| 16 | 애기똥풀 | *Chelidonium majus* | 초원·농경지 | 봄·여름 | leaf | toxic-research | uncommon | renewable | 채집 | 잠정 |
| 17 | 수레국화 | *Centaurea cyanus* | 초원·농경지 | 여름 | flower | blue-dye | uncommon | seasonal | 채집 | 잠정 |
| 18 | 패랭이꽃 | *Dianthus chinensis* | 초원·농경지 | 여름 | flower | ornamental | uncommon | seasonal | 채집 | 잠정 |
| 19 | 옥스아이데이지 | *Leucanthemum vulgare* | 초원·농경지 | 봄·여름 | flower | ornamental | common | renewable | 채집 | 잠정 |
| 20 | 산토끼꽃 | *Knautia arvensis* | 초원·농경지 | 여름·가을 | flower | pollinator | common | renewable | 채집 | 잠정 |
| 21 | 들종꽃 | *Campanula rotundifolia* | 초원·농경지,산맥 | 여름 | flower | ornamental | uncommon | seasonal | 채집 | 잠정 |
| 22 | 자주개자리 | *Medicago sativa* | 초원·농경지 | 봄·여름·가을 | leaf | forage | common | renewable | 채집 | 잠정 |
| 23 | 야생아욱 | *Malva sylvestris* | 초원·농경지 | 여름·가을 | leaf | fiber-herb | uncommon | renewable | 채집 | 잠정 |
| 24 | 야생 마조람 | *Origanum vulgare* | 초원·농경지 | 여름 | leaf | aromatic | uncommon | renewable | 채집 | 잠정 |
| 25 | 벌노랑이 | *Lotus corniculatus* | 초원·농경지 | 봄·여름 | flower | forage | common | renewable | 채집 | 잠정 |
| 26 | 가을과꽃 | *Symphyotrichum novi-belgii* | 초원·농경지 | 가을 | flower | ornamental | uncommon | seasonal | 채집 | 잠정 |
| 27 | 큰금계국 | *Coreopsis lanceolata* | 초원·농경지 | 여름 | flower | yellow-dye | uncommon | seasonal | 채집 | 잠정 |
| 28 | 꼬리풀 | *Veronica longifolia* | 초원·농경지 | 여름 | flower | ornamental | uncommon | seasonal | 채집 | 잠정 |
| 29 | 숲바람꽃 | *Anemonoides nemorosa* | 숲 | 봄 | flower | woodland-indicator | rare | seasonal | 관찰 | 잠정 |
| 30 | 블루벨 | *Hyacinthoides non-scripta* | 숲 | 봄 | flower | woodland-indicator | rare | seasonal | 관찰 | 잠정 |
| 31 | 앵초 | *Primula vulgaris* | 숲 | 봄 | flower | ornamental | uncommon | seasonal | 채집 | 잠정 |
| 32 | 제비꽃 | *Viola odorata* | 숲 | 봄 | flower | aromatic | uncommon | seasonal | 채집 | 잠정 |
| 33 | 은방울꽃 | *Convallaria majalis* | 숲 | 봄 | flower | toxic-research | rare | seasonal | 관찰 | 잠정 |
| 34 | 디기탈리스 | *Digitalis purpurea* | 숲 | 여름 | leaf | toxic-research | rare | seasonal | 관찰 | 잠정 |
| 35 | 붉은캄피온 | *Silene dioica* | 숲 | 봄·여름 | flower | ornamental | common | renewable | 채집 | 잠정 |
| 36 | 숲괭이밥 | *Oxalis acetosella* | 숲 | 봄·여름 | leaf | woodland-indicator | uncommon | renewable | 관찰 | 잠정 |
| 37 | 노루귀 | *Hepatica nobilis* | 숲 | 봄 | flower | woodland-indicator | rare | seasonal | 관찰 | 잠정 |
| 38 | 야생난초 | *Dactylorhiza fuchsii* | 숲 | 봄·여름 | flower | woodland-indicator | rare | seasonal | 관찰 | 잠정 |
| 39 | 야생수선화 | *Narcissus pseudonarcissus* | 숲 | 봄 | flower | ornamental | uncommon | seasonal | 관찰 | 잠정 |
| 40 | 물망초 | *Myosotis scorpioides* | 습지 | 봄·여름 | flower | ornamental | common | renewable | 채집 | 잠정 |
| 41 | 노랑붓꽃 | *Iris pseudacorus* | 습지 | 봄·여름 | flower | yellow-dye | uncommon | seasonal | 채집 | 잠정 |
| 42 | 부처꽃 | *Lythrum salicaria* | 습지 | 여름·가을 | flower | purple-dye | common | renewable | 채집 | 잠정 |
| 43 | 털쥐오줌풀 | *Valeriana officinalis* | 습지 | 여름 | root | aromatic | uncommon | slow | 채집 | 잠정 |
| 44 | 카디널플라워 | *Lobelia cardinalis* | 습지 | 여름·가을 | flower | red-dye | rare | seasonal | 관찰 | 잠정 |
| 45 | 분홍바늘꽃 | *Silene flos-cuculi* | 습지 | 여름 | flower | ornamental | common | renewable | 채집 | 잠정 |
| 46 | 큰바늘꽃 | *Epilobium hirsutum* | 습지 | 여름 | stem | fiber-herb | common | renewable | 채집 | 잠정 |
| 47 | 골풀 | *Juncus effusus* | 습지 | 봄·여름·가을 | stem | weaving | common | renewable | 채집 | 잠정 |
| 48 | 사초 | *Carex acutiformis* | 습지 | 봄·여름 | stem | weaving | common | renewable | 채집 | 잠정 |
| 49 | 물냉이 | *Nasturtium officinale* | 습지 | 봄·여름 | leaf | culinary-herb | uncommon | renewable | 채집 | 잠정 |
| 50 | 갈대 | *Phragmites australis* | 습지 | 여름·가을 | stem | weaving | common | slow | 채집 | 잠정 |
| 51 | 에델바이스 | *Leontopodium nivale* | 산맥 | 여름 | flower | ornamental | rare | seasonal | 관찰 | 잠정 |
| 52 | 고산용담 | *Gentiana acaulis* | 산맥 | 봄·여름 | flower | blue-dye | rare | seasonal | 관찰 | 잠정 |
| 53 | 아르니카 | *Arnica montana* | 산맥 | 여름 | flower | research-herb | rare | seasonal | 관찰 | 잠정 |
| 54 | 고산앵초 | *Primula farinosa* | 산맥 | 봄·여름 | flower | ornamental | uncommon | seasonal | 관찰 | 잠정 |
| 55 | 홍경천 | *Rhodiola rosea* | 산맥,설원 | 여름 | root | research-herb | rare | slow | 관찰 | 잠정 |
| 56 | 범의귀 | *Saxifraga paniculata* | 산맥 | 여름 | leaf | alpine-study | uncommon | seasonal | 관찰 | 잠정 |
| 57 | 고산제비꽃 | *Viola biflora* | 산맥 | 여름 | flower | ornamental | uncommon | seasonal | 관찰 | 잠정 |
| 58 | 바위장구채 | *Silene acaulis* | 산맥 | 여름 | flower | ornamental | rare | seasonal | 관찰 | 잠정 |
| 59 | 고산미나리아재비 | *Ranunculus glacialis* | 산맥,설원 | 여름 | flower | alpine-study | rare | seasonal | 관찰 | 잠정 |
| 60 | 고산양귀비 | *Papaver alpinum* | 산맥 | 여름 | flower | ornamental | uncommon | seasonal | 관찰 | 잠정 |
| 61 | 사막금잔화 | *Baileya multiradiata* | 사막 | 봄 | flower | yellow-dye | uncommon | rain-pulse | 채집 | 잠정 |
| 62 | 사막루핀 | *Lupinus sparsiflorus* | 사막 | 봄 | flower | ornamental | uncommon | rain-pulse | 채집 | 잠정 |
| 63 | 사막글로브맬로 | *Sphaeralcea ambigua* | 사막 | 봄·여름 | flower | orange-dye | common | rain-pulse | 채집 | 잠정 |
| 64 | 사막버베나 | *Abronia villosa* | 사막 | 봄 | flower | ornamental | uncommon | rain-pulse | 채집 | 잠정 |
| 65 | 데저트골드 | *Geraea canescens* | 사막 | 봄 | flower | yellow-dye | uncommon | rain-pulse | 채집 | 잠정 |
| 66 | 사막양귀비 | *Eschscholzia glyptosperma* | 사막 | 봄 | flower | ornamental | uncommon | rain-pulse | 채집 | 잠정 |
| 67 | 사막달맞이꽃 | *Oenothera deltoides* | 사막 | 봄 | flower | night-bloom | uncommon | rain-pulse | 채집 | 잠정 |
| 68 | 사막델피늄 | *Delphinium parishii* | 사막 | 봄 | flower | toxic-research | rare | rain-pulse | 관찰 | 잠정 |
| 69 | 패리펜스테몬 | *Penstemon parryi* | 사막 | 봄 | flower | ornamental | uncommon | rain-pulse | 채집 | 잠정 |
| 70 | 사막피들넥 | *Amsinckia tessellata* | 사막 | 봄 | flower | toxic-research | uncommon | rain-pulse | 관찰 | 잠정 |
| 71 | 갯질경이 | *Plantago maritima* | 해안·항구 | 여름·가을 | leaf | salt-tolerant | common | renewable | 채집 | 잠정 |
| 72 | 함초 | *Salicornia europaea* | 해안·항구 | 여름·가을 | stem | salt-tolerant | common | seasonal | 채집 | 잠정 |
| 73 | 해국 | *Aster spathulifolius* | 해안·항구 | 가을 | flower | ornamental | uncommon | seasonal | 채집 | 잠정 |
| 74 | 갯메꽃 | *Calystegia soldanella* | 해안·항구 | 봄·여름 | flower | ornamental | uncommon | seasonal | 채집 | 잠정 |
| 75 | 갯완두 | *Lathyrus japonicus* | 해안·항구 | 봄·여름 | flower | ornamental | uncommon | seasonal | 채집 | 잠정 |
| 76 | 갯방풍 | *Glehnia littoralis* | 해안·항구 | 봄·여름 | leaf | aromatic | rare | slow | 관찰 | 잠정 |
| 77 | 설강화 | *Galanthus nivalis* | 설원,숲 | 겨울·봄 | flower | winter-flower | uncommon | seasonal | 관찰 | 잠정 |
| 78 | 봄크로커스 | *Crocus vernus* | 설원 | 겨울·봄 | flower | winter-flower | uncommon | seasonal | 채집 | 잠정 |
| 79 | 헬레보루스 | *Helleborus niger* | 설원,숲 | 겨울·봄 | flower | toxic-research | rare | seasonal | 관찰 | 잠정 |
| 80 | 눈미나리아재비 | *Ranunculus nivalis* | 설원 | 여름 | flower | alpine-study | rare | seasonal | 관찰 | 잠정 |

## 후속 검증
1. 라틴 학명의 수용명/이명과 한국어 통용명, 보호종·귀화종·원예품종의 지역 적합성을 종별 자료로 교차 검증.
2. 잎·꽃·씨앗 등 다중 산출물과 `flowering` 조건을 실제 게임 시계 및 개체 상태에 연결.
3. 재생 메타데이터를 노드 단위 소모량, 기후와 저장 가능한 복원 상태에 연결.
4. 보호·관찰종을 실제 도감 관찰 이벤트와 연결하고 훼손형 자원 획득은 차단.
5. 계절/지역/등급의 수급량을 장기 시뮬레이션으로 보정.
