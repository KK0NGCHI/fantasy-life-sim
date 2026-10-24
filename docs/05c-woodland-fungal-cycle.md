# 05-C: World woodland–fungal cycle

This change implements a deterministic **regional ecological interaction layer** above the generic ecology kernel. It is intended for later tree-species adapters and is not a mature spatial forest simulation.

## Three connected transitions

1. **Trees → litter / roots / deadwood.** Oak and pine each have a data definition, initial world-owned tree records, age, health and age-based death. Live trees deposit a small amount of regional litter and support a root substrate. Once dead, a limited wood reserve transfers into shared deadwood over later days.
2. **Litter → soil.** In each tree habitat the necessary litter/soil substrate ledgers are initialized. Every full game day, a capped amount of litter is converted into rich soil where sufficient litter exists. Both material stocks are persisted through the pre-existing substrate ledger.
3. **Substrate → fungal colonization.** Where a parent mycelium exists and the appropriate shared regional substrate is sufficient, the fungal adapter can create a *single* satellite patch for that species/region. This is deterministic, bounded (index 1), preserves fungus species metadata and uses the same persistent ecology sites and fungal harvesting rules.

The common layer `src/woodland-cycle-05c.js` does not modify the 80 plant species themselves. It depends on the tree definitions, shared substrate ledger, climate and fungus adapter. Transition functions are pure: caller supplies snapshot, authoritative game seconds and world seed. The dispatcher reconciles woodland transitions after accepted gameplay actions, with no extra player action/time cost.

## Initial content and extensibility

Tree records currently cover oak and pine and use a common data-driven schema: `{id,regions,growthDays,lifespanDays,litter,wood}`. The independent tree state `{id,region,speciesId,ageDays,health,alive,deadwood}` is validated and persisted in the optional `resource05A.woodland05C` field. For tree species expansion, add species definitions and later choose an appropriate spatial generator; the generic daily transition need not fork per tree species.

Fungal satellites reuse `resource05A.ecologySites`. A separate regional ledger `resource05A.ecologySubstrates` contains the conserved bounded materials. Optional fields are checked by save-v3; saves made before 05-C continue to be accepted, but are **not silently converted** into the new woodland lifecycle.

## Validation gates

- Trees age, lose health, die, and yield finite deadwood.
- Litter is actually produced **and converted into soil** in inhabited forest regions, including regions lacking original fungal soil entries.
- Satellite fungus patches are deterministic and bounded at one per species/region.
- One uninterrupted 112-day advance must equal 112 single-day advances.
- Save-v3 roundtrip retains woodland, fungus and substrate state.
- Plant/05-A regression suite must remain green.

## Deliberate limitations

- These are **region-level aggregates**, not actual map tile tree placements. Existing logging produces wood resources and deadwood, but is not yet wired to the death of a specific tree record.
- Roots/litter/deadwood accumulation is rule-based, not biologically calibrated, and no natural seedling recruitment occurs after tree death; very long simulations can end with no living trees.
- The colonization rule has no spore trajectories, competitive exclusion or microsite suitability. It supports one satellite patch per species, not unbounded population explosion.
- Biological age, death, litter, soil and climate rates are **provisional gameplay values**.
- A later tree ecology pass needs planting, seedlings, individual tree harvest interaction, persistent spatial site identity, variable substrate input and conservation rules.

No merge into `main` without explicit approval.
