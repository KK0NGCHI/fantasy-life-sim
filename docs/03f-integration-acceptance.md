# Somnium 03-F — integration stability and Windows acceptance

2026-10-24 · Draft PR #39 · based on 03-E PR #38, not `main`.

## Branch dependency (all still Draft, not merged)
- #32 `integration/00-stabilization-20261023` ← `feat/global-clock-v3-saves`
- #33 `feat/03c-runtime-integration` ← integration 00
- #34 `feat/03c-completion-windows` ← #33
- #35 `feat/03d-generators-foundation` ← #34
- #36 `feat/03d-completion` ← #35
- #37 `feat/region-activity-realignment` ← #36
- #38 `feat/03e-world-persistence` ← #37
- #39 `feat/03f-integration-stability` ← #38
- Never fast-forward or merge to `main` before explicit review/approval. A green head CI is not equivalent to Windows browser QA.

## Rules of this pass
- 16 fixed world region anchors, but NOT 16 forced tile-exploration fields.
- Mine is `field`, not `dungeon`. Deep forest, deep mine, deep sea are non-tile skill-gated activities only.
- Ancient ruins are investigation, ruined graveyard is salvage; no reward/combat side effects are assumed complete.
- Labyrinth is the retained tile dungeon; forest tile generator is retained as internal generator prototype, not a requirement for every field.
- Action dispatcher alone advances game turns and integer game seconds. Invalid commands must leave state, clock and RNG unchanged.
- World snapshot is validated before applying to live state. Existing v2/v3 original save slots never rewritten automatically.

## Windows PowerShell smoke test
```powershell
git fetch origin
git switch feat/03f-integration-stability
git pull --ff-only
npm ci
npm run check
py -m http.server 8000
```
If `py` isn't installed, use `python -m http.server 8000`. Open http://localhost:8000/. Hard refresh Ctrl+Shift+R.

### Manual acceptance, Chrome and Edge
- New game clock starts Day 1 08:00:00 and advances only for accepted game actions.
- Travel between several of the 16 regions; the displayed 4×4 world map is not geographic distance.
- Mine appears as an ordinary field; no universal tile exploration on all regions.
- In forest/mine/sea, deep activity remains locked unless *real* exploration and profession mastery meets provisional requirements.
- Ancient ruins show investigation, ruined graveyard shows salvage; neither yields imaginary loot or combat.
- Enter and explore the labyrinth, use arrows/WASD, verify a normal step +6 seconds and wall collision time without teleporting.
- Test stairs 0↔-1, remembered tiles, manual and automatic exploration stop conditions.
- F5 save, reload page, F9 load: position, floor, game clock, previously seen tiles and generated geometry match.
- Use a fresh test slot/browser profile; verify legacy v2/v3 slots remain unchanged, never accept silent migration.
- In DevTools inspect Console for errors and Application > IndexedDB without deleting data.

## Exit criteria
- Both GitHub workflows pass on latest branch commit.
- No accidental 16-region tile-map contract or invented combat/skill levels.
- Save corruption/legacy checks pass; known old in-dungeon saves refuse unsafe migration.
- Windows Chrome + Edge checklist user-verified before marking 03-F fully accepted.
- File remaining known gaps under 03-E persistence migrations, actual gameplay resource Deltas, mastery/combat implementations.

## References
- GitHub protected branches and required checks: https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches
- GitHub troubleshooting required status checks: https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/troubleshooting-required-status-checks
