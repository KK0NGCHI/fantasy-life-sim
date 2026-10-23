# Somnium — Phase 00 stabilization checkpoint (2026-10-23)

## Baseline and integrated changes
- Working branch: `integration/00-stabilization-20261023`.
- Base: `feat/global-clock-v3-saves` at `aad2e452c14dfbde7198844d1f25de7a320d8bf5`.
- Merged without overlapping paths: PR #29 (`feat/03c-local-map-foundation`) and PR #30 (`fix/header-global-clock-and-handoff`). Integration merge commit `55d0426b45dafbac9392d5eeb6d10cc2262513d6`.
- Included: `src/engine/v3.ts`, `src/engine/world/local-movement.ts`, `src/v3.js`, two focused test files, and both handoff/foundation documents.
- No v2/v3 IndexedDB schema or existing slot contents modified; no `main` change.

## Verification evidence and remaining gates
- GitHub comparison confirms exactly seven changed paths compared to the v3 base before this checkpoint document.
- Both parent PR heads previously report completed successful `Prototype checks` and `Engine 01-A` workflows. **These do not constitute a run on the integration commit.**
- Integrated commit workflow result: not available at creation time.
- Local `npm run check` not executed by this session (private repository cannot be cloned into isolated runtime here).
- macOS Chrome/Safari browser checks are **pending**, not assumed successful.

## Developer verification (macOS)
```bash
git fetch origin
git switch integration/00-stabilization-20261023
git pull --ff-only
npm ci
npm run check
python3 -m http.server 8000
```
Visit `http://localhost:8000/`; hard reload `Cmd+Shift+R` when necessary.

1. New game starts at 1 day 08:00:00; six one-minute lifestyle actions display 08:06:00, not a visually fixed 08:00.
2. Region-to-forest 25 minute route: if no encounter, clock advances accordingly; encountering stops at correct intermediate time.
3. UI viewing alone: zero turns and seconds. Short actions advance seconds exactly once.
4. Save F5, reload page, load F9 only after explicit approval; compare region, itemWorld, turn, clock, RNG.
5. Verify v2 slots remain intact; v2 legacy conversion requires consent and generates a new v3 slot. Cancel leaves live state and originals unchanged.
6. Check broken/future-version JSON is rejected; no partial state mutation or silent overwrites.
7. Run `tests/world-03c-local.test.mjs` and `tests/header-global-clock.test.mjs` via `npm run check`; note local model is intentionally not yet wired to the old dungeon UI.
8. Repeat core smoke flow in Chrome and Safari. Record browser version, result, screenshot/log where applicable.

## Phase 00 exit criteria
- [x] Shared ancestry and paths compared for PR #29/#30.
- [x] Dedicated branch with both change sets; merge ancestry preserves each original head.
- [x] No storage schema or `main` edits.
- [ ] CI success on integrated head (not only parents).
- [ ] Mac `npm run check` in developer environment.
- [ ] Chrome/Safari time, travel and safe-save acceptance.
- [ ] Confirm intended long-term mainline merge order across nested draft PRs.

**Status:** Integration assembled; Phase 00 NOT yet closed until the unchecked gates pass. Do not merge this branch into `main` solely on the strength of parent PR CI.
