# 05-A material-tool selection increment (2026-10-24)

This is an **increment** on Draft PR #46, not full 05-A completion.

## Implemented
- The 05-A item definition registry now recognizes a material family for each of the four simple tool classes, rather than adding specialized tool families.
- Axe and pickaxe: starter stone plus copper, iron and steel; fishing rod: starter wood plus processed/reinforced wood; gathering gloves: starter cloth plus leather/reinforced leather. Material labels are **candidate data** and balance numbers are still provisional.
- The existing regional resource activity UI lists only actually owned tools for the selected activity, with accessible labels; the chosen tool definition is passed to the authoritative dispatch.
- The dispatcher confirms actual inventory ownership and rejects a forged or unowned `toolId` at zero time, zero XP, and no world mutation.
- A tool's rank changes progress per work action, with iron deposits requiring at least rank 2. Starter tool usage is unchanged, and the existing 05-A v3 save path preserves tool inventory and node work progress.
- Tests cover forged tools, starter selection and roundtrip.

## Explicitly not yet done
- No crafting/upgrade acquisition path for higher material tools. The new definitions cannot be obtained through ordinary 05-A play. Tool crafting, equipment maintenance and consumption of metal belong to 05-B.
- Higher material tools therefore have **engine capability**, but their gameplay availability cannot yet be marked complete.
- Full day-by-day 28/112/224 active-player production and XP, population-weighted fisheries, multi-stage tree growth, provenance-aware stack, and 03-E object Delta integration remain open.
- Existing v3/v2 slots are not silently migrated; no `main` merge.

## CI
See PR #46 GitHub Actions and tests/05a-resource-foundation.test.mjs; mark exact run status only after the final commit has completed all jobs.

Reference: Stardew Valley upgrades preserve familiar tool functions but change performance: https://wiki.stardewvalley.net/Tools . Tests should prioritize user-visible behavior: https://playwright.dev/docs/best-practices .
