# 03-C — Runtime integration, stage 2 (2026-10-23)

## Scope delivered on this branch
- Based on Phase 00 integrated clock/local-model branch, not `main`.
- Main dungeon movement invokes `dungeon.move` with cardinal **direction**, rather than sending unvalidated destination coordinates.
- `src/main-v2-inventory.js` resolves `dungeon.move` via 03-A `SOMNIUM_WORLD_03A` registry and 03-C pure `resolveLocalStep`. Existing V2 dispatcher is the only writer of turns and game-second clock.
- A wall attempt is an accepted game failure costing exactly 1 turn and 6 seconds; malformed direction is refused at zero cost. Attempts outside a dungeon do not mutate state.
- Dungeon entry derives its tile from `localArrival` (site entry ID), not an arbitrary UI coordinate.
- The main map renders the registry labyrinth 5x5 **test fixture** instead of legacy `TILES`. Automatic demo movement reads valid neighboring fixture cells.
- `tests/main-local-03c.test.mjs` covers these flows. No save schema changes, no previous slot migration.

## Remaining 03-C acceptance work
1. **Real floors and portals:** current map entries are self-linking fixtures. Build a distinct bidirectional, valid entrance/stair sample with map transition action and tests before claiming multi-floor exploration.
2. **Visibility:** implement deterministic line-of-sight/FOV, current visible vs previously seen, avoid revealing unseen enemies/hazards; storage of persistent discovery belongs to 03-E versioned world save contract.
3. **Automatic exploration:** replace the demo neighbor-choice tick with known-only hazard-safe route planning and proper interruption, reusing common dispatcher.
4. **Location consistency:** derive region/site from one canonical position when formal WorldRuntime03A is promoted into the save schema in 03-E. Current `world.runtime.pos` is still the established v3/v2 bridge, not the final world-state contract.
5. **Browser verification:** navigate in Mac Chrome and Safari; check blocked movement costs, displayed map coordinates, all direction keys/buttons, time +6 seconds per ground step, F5/F9 save and restore; verify legacy v2 slots untouched.
6. GitHub Actions `Engine 01-A` and `Prototype checks` **passed** at `a9f54023158638ce6cdac7d1f979dc6761bc387d`. Local Mac `npm run check` and browser QA remain pending. No automatic merge.

## Mac test
```bash
git fetch origin
git switch feat/03c-runtime-integration
git pull --ff-only
npm ci
npm run check
python3 -m http.server 8000
```
Visit http://localhost:8000/ and inspect dungeon map. It is intentionally a 5x5 fixture, not the final game map.

## Product rules unchanged
No item weight, no real-time clock, no destructive legacy save migration, no direct UI turn charging. Accepted in-world failures cost a turn; invalid technical requests cost zero.
