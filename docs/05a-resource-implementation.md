# 05-A Resource foundation — implementation checkpoint (2026-10-24)

**Status:** first functional prototype; all four action categories are available in their parent region, but the complete 05-A content/economy and full 28/112/224-day QA are **NOT finished**. This is a stacked Draft PR (#45), with base `docs/roadmap-status-20261024` (Draft #44). Never merge to `main` without approval.

## Implemented
- Twelve common resources in `src/resources-05a.js`: 야생 약초, 일반 버섯, 들풀, 참나무 통나무, 소나무 통나무, 일반 돌, 석탄, 구리광석, 철광석, 작은 민물고기, 잉어, 송어.
- Separate stable resource definition and region-bound logical resource sites (forest / field mine / river-lake; **no extra tiled maps**), with initial node counts from 05-A-9. Only first 2 nodes of each type discovered on new opt-in games.
- Activity categories are selected on the existing regional UI, then a discovered resource node is selected. User can execute one actual work step or a capped 50-step instruction until output.
- Bounded work duration: gather 50 ±5 sec, logging 65 ±10, mining 70 ±10, fishing 60 ±10. Deterministic triangular draw from the existing action RNG. The dispatcher remains the sole time authority.
- Manual resource prospecting: one specific resource at a time, 600 game seconds; reveals existing hidden nodes first, then (mine only) discovers new sites within day/week quota. New finite metal veins receive unique IDs. Visiting/repeated failed search never resets a vein.
- Starter prototype kit (cloth gloves, stone axe, stone pickaxe, wooden rod) is given to newly opted-in 05-A characters because the 05-B crafting loop does not yet exist. Existing saves are not granted free tools or resources. An iron vein requires a higher material tier than the stone starter pickaxe; actual tool upgrading is deferred to 05-B.
- Logging accumulates progress and yields several logs only at completed tree cutting. Mining accumulates progress and extracts units from finite deposits. Fishing rolls for bite/capture. Foraging harvests units from renewable colonies. Reward XP is granted only on actual items, not on failed fishing or cosmetic progress. Inventory quantity, RNG, XP, game clock, and resource state update together in one dispatcher action.
- Resource renewal is lazily reconciled against game-time, with 28-day seasons. Plants and trees are dormant in winter; fish and minerals not seasonally dormant under this prototype. Stone cycles to another exposed face, while metals do not naturally refill. Region prospecting supplies routine metal veins.
- Optional `world.runtime.resource05A` state is persisted by the existing v3 save envelope. When present it is strictly validated by decoder before load; when absent, old slots remain without the new subsystem and no silent migration is performed.

## Core boundaries and remaining gaps
1. The current prototype saves resource sites in the optional region runtime snapshot, **not yet through 03-E object Delta adapters**. The final object-Delta contract, generator-version upgrades and snapshot compaction need a dedicated follow-up before full 05-A completion.
2. Exact cosmic provenance and sacred status are not generated; mundane items are defined but generic item-world stacks do not yet carry detailed functional origin or quality differences. They must not be silently merged when implemented.
3. Tool grades beyond the initial starter types, crafting/upgrading/repair, equipment slots and durability do not yet work. The category list and work thresholds support later material upgrades. No encumbrance/weight.
4. The 28-day calendar is 05-A's prototype ecology convention; global calendar migration/version rules must be finalized before applying calendar adjustments to old saves.
5. Fishing is a basic probability prototype, not yet the complete species/season/time/location weighted fishery; the three fish species currently have separate logical nodes within the same parent field.
6. Forest regrowth is a single stump/full-state cycle with an accumulated seasonal timer, not yet a visible multi-stage sapling/young/mature object model.
7. The 28/112/224-day production and economic budget checks still require deeper simulation, particularly field diversity, crafting consumption and regional generation quotas.
8. 05-D HP/MP/hunger threshold-based automation, safe auto-target switching and background-exclusive recipes remain deferred.
9. Browser Chromium smoke checks the game regressions; dedicated UI end-to-end coverage for all four resource panels, multiple tool materials and Windows Chrome/Edge manual QA still outstanding.

## Safety and test gates
- No v2/v3 IndexedDB name change or slot overwrites.
- Zero time/XP on invalid region, hidden node, depleted node, missing tool, or unavailable metal discovery. Valid work can spend time with no drop (progress, bite missed).
- No same resource node harvest duplication or repeated new vein creation on the same day, across reloads.
- All source states and random rolls are deterministic from stored world/RNG state.
- Use Playwright's user-visible behavior testing philosophy: https://playwright.dev/docs/best-practices and IndexedDB transaction completion guarantees: https://developer.mozilla.org/en-US/docs/Web/API/IDBTransaction/complete_event.

## Windows
```powershell
git fetch origin
git switch feat/05a-resource-foundation
git pull --ff-only
npm install
npm run check
py -m http.server 8000
```
Open http://localhost:8000/ and visit the 숲, 광산, or 강·호수 region under 생활. New characters on this branch have resource nodes; legacy saves do not auto-convert.
