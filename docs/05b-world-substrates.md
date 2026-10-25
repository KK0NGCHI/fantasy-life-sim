# 05-B: World substrate ledger (initial bridge)

## Purpose

The fungal `substrateHealth` field introduced in PR #61 represents a per-mycelium local reserve. This PR adds a separate region-level substrate ledger so multiple fungal species sharing a substrate are affected by the same finite material.

- `src/fungal-substrates-05b.js`: one stable region/type record, with a bounded `remaining`, and pure change/consume functions.
- `src/main-v2-inventory.js`: successful fruit-body harvest consumes both the fungal site's local nutrient reserve and 5 units of the shared substrate. The update is atomic with inventory and site state. Successful wood logging increases forest deadwood where a deadwood ledger exists, without charging extra game time.
- `src/engine/save/save-v3.ts`: optional `resource05A.ecologySubstrates` is validated and persisted without requiring a new save schema. Legacy saves without this ledger still run with their previous behavior.

## Guarantees

The substrate ledger is independent of fungus definitions and is therefore a reference for mineral ore host-rock, animal shelter or plant soil resource interactions. Several mycelia can refer to the same region substrate record. Depletion is bounded at zero, creation bounded at 1000. State functions are deterministic and use authoritative game seconds.

## Limits (not complete world-object ecology)

Substrates currently have region/type identity, **not** tile coordinates or actual logs placed on terrain; cutting oak adds regional deadwood under a content-policy simplification. `hardwood` and `living-tree-roots` are not automatically replenished by that operation. Leaf litter, topsoil dynamics, decomposition, fungi-host tree reciprocal effects, spore dispersal and succession are outside this bridge. `substrateHealth` and the shared ledger currently both debit during successful harvest to model two scales; the balancing policy is provisional.

A future integration should replace region aggregates with localized substrate instances and explicit producer events from tree death, leaf fall, grazing and terrain changes. Existing plant 80-species tests remain regression gates. No main merge.
