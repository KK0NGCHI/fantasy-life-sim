# 03-D completion — generated forest and dungeon integration (2026-10-23)

Based on `feat/03d-generators-foundation`. This branch uses the 03-C runtime dispatcher, and must be reviewed as a stacked PR. Old save schemas and IndexedDB records are not migrated.

## Implemented
- Deterministic forest, cavern, and dungeon generators (24×24 UI preview), separate geometry/path/decoration RNG, bounded attempts and connected entrance positions.
- Runtime now resolves the active local `siteId` (forest or labyrinth), rather than assuming all exploration is in the labyrinth.
- Forest region offers a `숲길 탐험` action to enter a generated forest map. Leaving returns to the existing regional life page. Site movement, FOV and route finding use the same site-scoped world registry; no extra movement time charged in the UI.
- Labyrinth floor links and existing 03-C clock semantics preserved.
- Tests cover forest entry constraints, generated map identity, and deterministic repeatable output, along with 200-seed dungeon generation batch.

## Non-goals / unfinished integration
- Generator profile coverage for all 16 distinct regions is **not** included; the field prototype targets forest, while labyrinth uses dungeon/cavern. More biome content is future work.
- `generatedWorld:true` is still a fixed-preview seed. No per-save worldSeed or generated map snapshot stored. Formal persistence, world state migration, discovery and Delta are deferred to 03-E.
- Resource and landmark placements are abstract deterministic slots, not harvestable object instances. No monster/quest/economy effects.
- Windows Chrome/Edge UI manual acceptance has not yet been performed.

## Windows PowerShell QA
```powershell
git fetch origin
git switch feat/03d-completion
git pull --ff-only
npm ci
npm run check
py -m http.server 8000
```
Use `python -m http.server 8000` if `py` is unavailable. Visit http://localhost:8000/ in Chrome or Edge; Ctrl+Shift+R to bypass cache.

1. On the world map, travel to `숲`, then on its life page click `숲길 탐험`. A generated 24×24 local map should appear; arrow/WASD directions operate through the central dispatcher.
2. Leave the forest and return to the same forest region. Enter again and compare the map layout.
3. Travel to the labyrinth region and enter its generated dungeon; find the reciprocal stairs. Observe one turn/6 seconds for ordinary movement and correct FOV/auto halt.
4. Verify F5/F9 saves cautiously with a new slot; do not treat map persistence as fully implemented. Existing v2/v3 slots must remain intact.
5. Verify no console errors and no UI freezes in both Chrome and Edge.

## References
- https://www.redblobgames.com/x/2043-bfs-dungeons/
- https://journal.stuffwithstuff.com/2014/12/21/rooms-and-mazes/
