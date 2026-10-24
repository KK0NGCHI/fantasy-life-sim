# 05-A stabilization acceptance (2026-10-24)

Status: **resource-core stabilization checks PASS**, broader 05-A feature scope remains explicitly unfinished. Draft PR #46 targets Draft PR #45's branch. No `main` merge.

## Resolved issues
- A partially cut tree or partially mined stone face no longer resets merely because a recovery period elapsed. Renewal of these completed sites begins only after depletion.
- Mine prospecting quotas start at Day 1 with no unearned full-day quota. Additional prospect IDs count completed game days, not a calendar timestamp offset.
- 28/112/224-day deterministic tests cover maximum created mine sites for stone, coal, copper and iron. Verify no duplicate IDs or replacement of earlier finite veins.
- Save-style one-day slices and a single 224-day jump yield identical herb recovery state; winter stops herb recovery.
- Material-rank mechanics test verified higher-ranked tools perform more work, and stone pickaxes cannot mine iron in the current content rules. Actual material upgrades are **NOT usable via crafting/equipment UI yet**.

## CI results
Last code SHA `5b98c5e5007f177352b67a5bfd60f77933ed7d5a`:
- Linux engine unit/regression: SUCCESS
- Windows smoke: SUCCESS
- Chromium browser E2E: SUCCESS (existing UI forest harvest with F5/F9 recovery)
- Prototype checks: SUCCESS

## Acceptance boundary
These tests establish **deterministic supply capacity and restart-safe recovery**, not proof that a 1–2-game-year loop has compelling pacing. Tests do **not** simulate an autonomous player for 224 days with hunger, travel, crafting demand, seasonal fish composition, inventory depletion, true material upgrades, and NPC economies. Such a claim would be premature.

Outstanding:
- 05-B material tool crafting/selection, repair and equipment properties;
- species-weighted fisheries and realistic catch feedback;
- sapling/young/mature tree stages;
- proper `03-E` object Delta adapters, authored region variations, and provenance-aware item stacks;
- 28/112/224-day **player-agent production/XP and consumption** simulations, not just site quotas;
- targeted UI Chrome/Edge manual acceptance on the user's Windows machine.

No existing IndexedDB schema or slot is silently migrated. Invalid/unavailable work costs 0 time and no XP; valid failed work may cost time without rewards. For UI tests prefer user-visible actions rather than in-memory hooks per [Playwright](https://playwright.dev/docs/best-practices); restore is confirmed after committed [IndexedDB transactions](https://developer.mozilla.org/en-US/docs/Web/API/IDBTransaction/complete_event).
