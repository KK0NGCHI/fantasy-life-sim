# Somnium 03-D implementation checkpoint — 2026-10-23

## Status
Implementation on `feat/03d-generators-foundation` (Draft PR #35). Based on `feat/03c-completion-windows`. Do not merge to `main` until 03-C and Phase 00 ancestry is reviewed.

### Implemented
- Independent deterministic streams for geometry, route carving, decoration.
- Three generation algorithms: forest, cavern, dungeon; designed dungeon connectivity and a cross-link before decoration.
- Bounded profiles (16–128), bounded attempts and explicit failure, deterministic per `worldSeed`, generator version, site, generation index and floor/profile.
- Validates generated ground at entrances and BFS connectivity to required exits. Uses stable namespace map/site/entrance IDs and separate non-item placement slots.
- Optional generated runtime registry for forest and two-floor labyrinth. Main UI opts in, presenting 24×24 generated labyrinth maps with existing 03-C movement, visibility and reciprocal portal handling.
- Regression tests: 200 seed dungeon batch, profile rejection, determinism, opt-in vs legacy fixture.
- Existing static base registry, save schema, IndexedDB databases and slots untouched.

### Known limitations and hard gates
- **03-E is required for production persistence**: current UI uses a fixed explicit preview seed `somnium-03d-preview-v1`, not a persisted per-save world seed. A generated map snapshot and Delta, discovery, and version-safe restore remain unimplemented. Do NOT claim unique persistent worlds yet.
- 24×24 is a trial size, not a final design contract. Generated forest profile exists; no separate forest-local UI entry flow yet.
- The dungeon algorithm provides connected rooms/loops and map connectivity, but content placement is only abstract slots. Monsters, rewards, harvesting or resource persistence not included.
- FOV and auto behavior inherit 03-C limitations; a generated map must not reveal hidden hazards through routes.
- Windows Chrome/Edge manual smoke test has not been performed remotely.

### Windows PowerShell
```powershell
git fetch origin
git switch feat/03d-generators-foundation
git pull --ff-only
npm ci
npm run check
py -m http.server 8000
```
If `py` is unavailable: `python -m http.server 8000`. Open http://localhost:8000/ in Edge or Chrome; Ctrl+Shift+R refresh; Ctrl+C stop.

Verify the dungeon has a 24×24 generated tile layout and starts at (2,2). Movement and wall costs should still be 1 turn and 6 game seconds. The stair on surface lies at (21,21) and is guaranteed reachable by the generated path (not necessarily a direct route). Only after standing on it can you use the portal to -1. Confirm time, discovered tiles, auto stop policy, item behavior and F5/F9. The base map will be reproducible in this preview build; it is not per-world-seed persistent.

### Design sources
- https://www.redblobgames.com/x/2043-bfs-dungeons/ (rooms, graph analysis, loops and connectivity)
- https://gamedev.net/blogs/entry/2249558/ (Spelunky path-first rooms and templates)
- https://sersavictory.itch.io/cyclic-dungeon-generation (cyclic-dungeon design patterns)
