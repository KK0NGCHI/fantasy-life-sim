# Ecology Core 05-A — reusable ecosystem contract

This package extends Draft PR #58. It is deliberately species-agnostic and does **not** require a new gameplay save version for new worlds.

## Separation of concerns

1. `src/ecology-core-05a.js`: pure, deterministic state transition functions. No world RNG or clock ownership; no inventory or UI dependencies. Definition validation, site identity, conditional availability, stage-specific output, depletion, elapsed-seconds regrowth, bulk reconciliation.
2. `src/botanical-ecology-adapter-05a.js`: turns all 80 plant profiles into species definitions and one or two deterministic starting patches per applicable region. Future fungi, minerals or aquatic species may supply alternative definitions and use the same kernel.
3. `src/main-v2-inventory.js`: optional `ecology05A:true` initializes persisted `resource05A.ecologySites`. Existing incidental discovery spends stock from the appropriate region/species patch, otherwise falls back to existing species cooldown when an older world has no patch data.
4. `src/engine/save/save-v3.ts`: validates optional patch snapshots (bounded count, identifiers, stock, time, discovery). Existing older saves without these sites remain valid.
5. `src/v3.js`: enables this path for newly initialized playable sessions.

## Core state contract

```js
{
 id: 'eco05a:<encoded region>:<encoded item id>:0',
 speciesId: 'item05a:...',
 region: '숲',
 patch: 0,
 remaining: 3,
 updatedAt: 0, // authoritative game seconds
 discovered: false
}
```

Definition: `{id, habitats, capacity, regrowSeconds, mode, outputs, seasons?, weather?, dayparts?, minElevation?, maxDepth?}`. Output: `{id, part, stage, weight}`. `ecologyInteract` accepts a site, definition, authoritative context and caller-supplied roll; it returns a new site and output, never mutating the original. `ecologyReconcile` runs with elapsed world seconds. Invalid climate/depth/height inputs are **fail-closed**.

## Invariants and limits

- No infinite rerolls: stock is consumed from a persisted patch when obtaining a botanical item.
- Replenishment never exceeds capacity and runs lazily based on world seconds.
- Observations are non-destructive and recorded once per species in existing flags. Observation-only species cannot enter material loot.
- One *fixed* patch per region/species is a first release of patch semantics. Multiple randomized spatial patches, dispersal, seeding, ecological succession, carrying capacity and competition are **not** implemented.
- A deterministic provisional climate producer derives regional weather from a persistent world seed and game day; it is part of the engine and requires no wall clock. It is NOT a geographically calibrated meteorological model. The provisional regions/seasons and content balance remain design data.
- Separate seed items exist for gatherable species and use flowering-stage outputs. Species' primary part (leaf/flower/stem/root) remains represented by its original species item; separate independent leaf/flower inventories and growth state per individual are **not** implemented.
- Existing saves without `ecologySites` intentionally retain legacy cooldown behavior. Migration is not silently performed.
- The regional UI lists discovered plant patches and provides a direct 60-second harvest action, while incidental finds also consume persisted patch stock. Shared definitions make other resource families possible; new fungus/fauna populations are not shipped yet.

Do not mark the complete game ecosystem production-final until spatial ecology, reliable world-weather inputs, migration, multistage harvesting, and long-run simulation are complete.

## Climate and output follow-up

- `src/ecology-climate-05a.js` exposes `ecologyClimate05A(worldSeed, region, gameSeconds)` as a stable deterministic climate value. Existing authoritative `runtime.weather05A` takes precedence.
- `src/botanical-ecology-adapter-05a.js` registers plant seed items and bloom-stage seed outputs, with stage-independent base production when mature. This is a gameplay approximation of plant biology.
- `tests/05a-ecology-core.test.mjs` includes cross-domain fungus demonstration, weather/elevation/depth rejection, multiple patch independence, patch depletion, climate seed save stability, direct patch harvest and seed-stage distinction.
