# 05-D integration stabilization pass 01

## Scope and source of truth
Based on stacked Draft PR #63. No UI overhaul, no change to the main branch. The actual engine/state contracts and user-approved game design take precedence over early technical examples.

## Verified defects and fixes
1. **Stale dispatcher result after woodland reconciliation.** The dispatcher previously committed woodland/soil/fungal day transitions to its internal `state`, but returned the underlying dispatcher `result.nextState` from *before* those transitions. Consumers of manual or automated dispatch could observe a different world from `current()`. Reconciliation now operates on a staged candidate and the accepted result returns a snapshot of the final authoritative state. Rejected commands do not mutate game state.
2. **Fungal resource acquisition rejected.** The original 05-A `acquiredCompendium05A` validates only its known original catalog and botanical definitions. Feeding it an otherwise valid `item05b:` fungus caused `INVALID_REWARDS`, surfacing as `EXECUTION_ERROR` in repeated forest exploration. The integration boundary now checks explicit extended IDs for fungi and botanical seeds, retains sorted/deduplicated compendium item IDs, and delegates all legacy rewards to their original, stricter provenance validator.

## Regression coverage
- After an accepted action advances past a woodland day boundary, the result's `nextState` must match `current()`, including substrates and trees.
- Rejected actions leave state and clock untouched.
- With all plant, fungal, shared-substrate and woodland features switched on, repeated forest exploration must remain accepted instead of throwing reward-validation errors.
- The existing 05-A/05-B/05-C engine, Windows and browser checks remain required.

## Known incomplete integration, not asserted fixed
- No authorized migration to populate `woodland05C` and `ecologySites` into older saved worlds; old saves remain readable and no silent migration occurs.
- Time progression is reconciled in the public `createMainV2Inventory.dispatch` wrapper; dedicated travel state methods or other direct state mutators may bypass the post-action ecological clock until audited.
- The existing automatic-activity subsystem has not yet been proven equivalent to each newly added manual plant/fungus command under all stop/pause conditions.
- The full UI/UX overhaul, explanatory failure messages, status previews, and mobile/a11y interaction tests remain a distinct next phase.
- Region-level aggregate substrates/trees and multi-day simulation complexity are not yet fully balanced or spatially grounded.

## Next gates
1. Audit all state-changing methods and time paths for the same reconciliation transaction; test interrupted travel and automatic activities.
2. Add an explicit, previewable, opt-in conversion procedure for older worlds and rollback tests.
3. Validate save/reload mid-run and over long periods, then organize the interface under region resource, ecology status and compendium.
