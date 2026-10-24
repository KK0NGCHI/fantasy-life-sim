# 05-A: activity reward integration and provisional item table

## Scope
The current UI passes `ACTIVITY_TABLES_05A` into `createMainV2Inventory`. A regional 10-minute explore button is displayed for configured regions. Existing `resource.work` and `region.activity` handlers optionally draw resource-side rewards; source harvesting and incidental rewards remain distinct. These tables use only already registered `item05a:*` items.

## Provisional table (not final ecology or balance)

| Region | Activity | Per eligible 600s discovery chance | Item (single candidate) |
|---|---|---:|---|
| 숲 | explore | 20% | 야생 약초 |
| 숲 | gather | 10% | 일반 버섯 |
| 숲 | logging | 4% | 참나무 통나무 |
| 초원·농경지 | explore | 12% | 블루베리 |
| 습지 | explore | 16% | 갈대 |
| 강·호수 | fishing | 8% | 갈대 |
| 해안·항구 | explore | 12% | 홍합 |
| 설원 | explore | 3% | 송어 (placeholder; replace with grounded snow-area content) |
| 사막 | explore | 6% | 일반 돌 |
| 산맥 | explore | 10% | 일반 돌 |
| 광산 | mining | 8% | 일반 돌 |
| 고대 유적 | investigate | 10% | 일반 돌 |
| 폐허·묘지 | salvage | 12% | 일반 돌 |
| 바다 | explore | 6% | 홍합 |

These values are engineering sample content. No rare botanical candidate from the 80-entry research list has been canonized. Entries must be revised in ecological review; e.g. snow trout on land exploration is an obvious placeholder, not a proposed ecological claim. Bare movement time is not yet a complete exploration skill system.

## Known constraints
- Daypart and season come from the engine's game clock; weather-gated results remain excluded until weather is authoritative.
- Long actions process every crossed 600-second global boundary. A different combination of mixed qualifying and non-qualifying action lengths may still affect eligibility; a persistent per-activity accumulated eligibility-clock would require a new versioned save field or sidecar.
- Fast travel applies the destination region only on arrival, not segment-specific ecology along the route.
- Discover-site mode only reveals already stored hidden sites; no infinite random nodes.
- Gameplay/UI E2E for the specific explore button is not yet present. The engine and generic browser smoke run in CI.
- Plants from the earlier 80-entry research pass need exact taxon and occurrence/harvest rules before production drop rates.
- Not approved for main branch merge.
