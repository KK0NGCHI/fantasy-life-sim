# 05-A Botanical curation pass 01

This pass **does not** certify the earlier 80 botanical candidate entries. It introduces only six individually identified scientific species into the actual reward registry. Species identification and broad habitat are evidence-backed; Somnium seasons and weights are **provisional game design** rather than botanical claims. No pharmacological effects or safe real-life foraging claims are made.

| Species | Latin binomial | Somnium region | Eligible seasons (proposal) | Source |
| --- | --- | --- | --- | --- |
| 큰질경이 | Plantago major | 초원·농경지 | spring, summer, autumn | [Kew POWO](https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:321286-2/general-information) |
| 데이지 | Bellis perennis | 초원·농경지 | spring, summer | [Kew POWO](https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:184409-1/general-information) |
| 서양톱풀 | Achillea millefolium | 초원·농경지, 숲 | summer, autumn | [Kew POWO](https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:2294-2/general-information) |
| 야생 마늘 | Allium ursinum | 숲 | spring | [Woodland Trust](https://www.woodlandtrust.org.uk/trees-woods-and-wildlife/plants/wild-flowers/wild-garlic/) |
| 물박하 | Mentha aquatica | 습지 | summer, autumn | [Kew POWO](https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:450192-1/general-information) |
| 동의나물 | Caltha palustris | 습지 | spring | [Kew POWO](https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:42867-2) |

## Implementation
- New `src/botanical-species-05a.js` holds six vetted identities, eligible regions, proposed seasons and provenance.
- Inventory templates, registry and compendium validators accept these six additive item IDs.
- Existing `ACTIVITY_TABLES_05A` add **one common tier** with old item weight 4 and each eligible botanical weight 1. This 4:1 ratio is a temporary test fixture, **not** an approved economy distribution.
- All tables still need ecology and economy approval; winter-qualified species are not yet present. Bluebells and wood anemones remain unshipped pending an explicit non-destructive/observation-only policy.
- No change to the generic 70/30 example: it remains a test, not official rarity weights.
- Existing saves are structurally unchanged. Content is additive; verify restore of newly obtained botanical item with save-v3 as separate gate.
- Existing movement segmentation, weather/altitude/depth and auto-exploration parity remain open limitations.

## Research backlog
The earlier 80 candidate entries require accepted Latin names, synonyms/duplicates, habitat provenance, leaf vs flower harvest windows and conservation rules before promotion. Do not convert them en masse into items. Add species in independently reviewable batches.
