# Somnium 05-A: 28 / 112 / 224 game-day activity simulation

Date: 2026-10-24. Draft PR #47; base `feat/05a-stabilization`. This is a **simulation report**, not a claim that 05-A is entirely finished or that a 2-year game loop has been proven fun.

## Method
The executable `tests/05a-long-horizon.mjs` uses real `createResourceNodes05A`, `resourceAt05A`, `workResource05A`, `workDuration05A`, and `discoverResource05A` functions. The PR test logs `SIM05A` JSON. A fixed LCG controls times/selection/outcomes, making repeated results deterministic. Regeneration is reconciled daily before activity.

- **casual**: 2 game hours/day, 3 days/week; every week switches among gather, logging, mining and fishing.
- **specialist**: 4 game hours/day, 5 days/week, mining only.
- **intensive**: 6 game hours/day, 7 days/week, mining only.
- All use prototype rank-1 tools, so the current iron vein rank-2 gate leaves iron inaccessible.
- Actions, outcomes and time increments are simulated from the 05-A resource engine; this **is not** a full main-v2 dispatcher game replay with the world graph, inventory, explicit action ID deduplication, hunger/sleep and save I/O on every turn.
- The test uses the prototype early mine-discovery policy. Failed/no-available-node days are measured but not guaranteed to represent optimal player strategy.

## Results (measured from CI engine test)

| Profile | Days | Actual items | XP across performed skills | Engine work steps | Nodes (all regions) |
| --- | ---: | ---: | ---: | ---: | ---: |
| casual | 28 | 98 | 717 | 854 | 107 |
| casual | 112 | 395 | 2,867 | 3,407 | 107 |
| casual | 224 | 794 | 5,648 | 6,626 | 107 |
| specialist | 28 | 350 | 1,735 | 4,002 | 113 |
| specialist | 112 | 1,573 | 6,259 | 16,139 | 131 |
| specialist | 224 | 3,323 | 11,939 | 32,436 | 143 |
| intensive | 28 | 638 | 2,914 | 7,002 | 119 |
| intensive | 112 | 3,383 | 11,959 | 32,673 | 143 |
| intensive | 224 | 7,210 | 23,490 | 67,171 | 144 |

The existing 04-A XP formula needs 29,754 XP to reach level 30 from level 1. On this assumption specialist mining reaches level 21 at day 224; intensive mining level 27. Casual total XP is divided among **four separate skills**; it is not a single-skill level.

### Day-224 material composition

| Profile | Stone | Coal | Copper ore | Iron ore |
| --- | ---: | ---: | ---: | ---: |
| specialist | 2,929 | 130 | 264 | 0 |
| intensive | 6,838 | 180 | 192 | 0 |

**Major design findings**
1. Basic stone dominates mining returns: about 88% of specialist output and 95% of intensive output. 05-B crafting consumption has not been defined, so this is a **red flag for economic balance**, not proof of inflation.
2. Rank-1 starter tools cannot mine iron. Material upgrades are only registered as definitions, not attainable through gameplay. Therefore a starter mining specialist **cannot access the entire designed material pipeline**. A progression pathway is required.
3. A high work count (intensive day 224 = 67,171 work steps) would be unacceptable as manual UI clicks; batching or the 05-D automation controller is important. Simulation work steps are not individual manual user clicks.
4. No sample has reached mining level 30 at day 224, but the measured rate is from **static mining effectiveness**: progression XP earned does not currently feed back into work power. Hence this cannot validate full 04-A skill-to-production curves.
5. Fishery is sampled through three independent per-species prototype nodes, without seasonal/time-specific weighted fish tables; the simulation cannot certify fish ecology.
6. The resource-site search is a simple fixed pseudo-random policy and a daily regeneration pass, not an optimal or fully agentic prospecting strategy. No travel or exploration XP is included.
7. Area-wide 03-E object Delta migration and origin-preserving inventory stacks still require integration before final 05-A acceptance.

### Design gates before full feature acceptance
- Add usable basic-to-better-material tool acquisition without a circular dependency on inaccessible iron; test stone→copper→iron→steel paths.
- Make XP diminish on easy resources at high skill levels, and actually feed skill levels into work/accuracy/time. Preserve 31+ shallow practical growth.
- Calibrate replenishment and find rate against 05-B consumption. Especially do not allow excessive stone to drown out rare ore acquisition; don't artificially suppress basic stone if buildings genuinely consume it.
- Re-run 28/112/224-day activity simulations with 05-B recipes, travel, sleep/needs, season-appropriate fishing and genuine inventory persistence after work cycles.
- Preserve safety: no real-time waiting, no silent existing save upgrades, no unapproved merges to main, and no 16-region tiling.

## External reference design comparison
Stardew Valley foraging has a per-map weekly spawn cap; removing forage does not instantly increase the week's budget: https://wiki.stardewvalley.net/Forage .
Stardew Valley quarry has daily spawn attempts and surviving rocks can block new spawns: https://wiki.stardewvalley.net/Quarry .
RuneScape's mining update separates per-strike progress from ore completion and pickaxe/skill impacts progress: https://runescape.wiki/w/Mining_and_Smithing_rework .

## Reproduce
```powershell
git fetch origin
git switch test/05a-long-horizon-simulation
git pull --ff-only
npm install
npm run check
node tests/05a-long-horizon.mjs
```

CI on SHA `d003571ea1ffb8c4524087a55dc8cb4aadac391a`: Engine 01-A engine / Windows smoke / Chromium success, Prototype checks success. The report file itself is documentation-only and should be checked separately on its resulting commit.
