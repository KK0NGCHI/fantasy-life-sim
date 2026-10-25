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
npm install
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

## Automated real-browser acceptance (03-F continuation)
- `tests/browser-03f-smoke.mjs` runs real Chromium, uses actual IndexedDB, verifies F5 persisted quick save, reload, F9 approval, and 16-region map rendering.
- The GitHub `browser-chromium` CI job installs a temporary pinned Playwright version without changing package manifest, compiles the engine and serves the game locally. This is a Linux headless Chromium smoke only, **not** Windows Edge GUI acceptance.
- `windows-smoke` is Node/TypeScript integration on Windows runner. Preserve human Edge/Chrome interaction checks as outstanding.
- Avoid using `npm ci` until a reviewed lockfile is committed; current install uses `npm install`.

## 03-F final integration checkpoint (2026-10-24)
- Final verified functional commit: `2a066d5797bd77a3d9d59c0d776a67e24af79e53`.
- GitHub Actions: Engine 01-A Linux job **success**; Windows smoke **success**; Linux headless Chromium **success**; Prototype checks **success** (verify latest documentation-only run separately).
- Actual Chromium UI path now covers world map -> multi-segment travel (with encounter resume) -> lifestyle -> dungeon entry -> rendered 24×24 tile map -> auto-explore start/stop -> cardinal movement -> F5 quicksave -> page reload -> F9 approved restore -> dungeon exit.
- Earlier false negative came from an ambiguous `생활` button locator. Test now targets `#bottomNav button[aria-label="생활"]`; it doesn't bypass or fake navigation.
- Browser-executed deterministic engine round-trip also verifies saved map/world/clock/RNG/discovery and reciprocal stairs 0↔−1. A test defect (route planned from x=3 while replay started at x=2) was corrected. This stair verification is engine-driven inside the real browser, **not** clicking the real UI stair button.
- The three CI jobs are automated acceptance, not proof of a human Windows Edge/Chrome GUI session. User's prior general "검수 ok" was acknowledged but must not be represented as detailed manual proof of all scenarios.
- Missing game content (skill growth, combat encounters, object-specific world Deltas, legacy in-dungeon save migration) stays tracked outside 03-F. Existing data and save databases untouched; `main` unmerged; stacked Draft PR #39 awaits integration approval.
- Further UI stair-click and high-duration auto-explore endurance validation may be taken as separate post-03-F QA, not silently declared tested.
