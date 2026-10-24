# 04-B Species, background, body-size contract
Status: prototype implementation, Draft PR #41 atop Draft #40.

## Settled decisions
- 3 body size categories: `medium` 보통, `small` 소형, `tiny` 초소형.
- The 24×24 dungeon retains its existing terrain tile sizes and **all** characters occupy exactly **one** local tile. No sub-tiles, altered movement seconds, size-dependent auto-navigation, or geometry rebuild.
- Backgrounds provide identity-locked abilities inaccessible through high ordinary skill levels. No main story / required victory path mandates a certain background.
- No weight or encumbrance mechanics. Armor light/heavy classification is independent of physical sizing.

## Implemented
- Immutable prototype definitions: 8 species (human, elf, dwarf, halfling, beastfolk, orc, gnome, fairy), 16 backgrounds.
- Default size choices are content candidates, not final lore: dwarf and beastfolk default `medium`, gnome and halfling `small`, fairy `tiny`.
- Background grants primary level 3 and secondary level 2 (trial), as cumulative XP. This is the single initial grant; no duplicated grants on replay or restore.
- Background ability IDs are exclusive persistent identity markers, with `hasExclusiveAbility` predicate. **Their effects are not implemented** until dialogue, NPC, recipes, or world-object contracts exist.
- Engine opt-in initial selection and existing character UI selection modal, including details, clear irreversible choice, and saved `progression.origin04B`.
- `canUsePassage` supports optional passage-size tags for future geometry; it does **not** modify any existing dungeon tile or movement behavior.
- Engine and Chromium tests for size classification, skill XP, origin immutability, and UI selection.

## Deferred and safety boundaries
- Concrete racial abilities, sizes/gear adaptation, NPC relations, and exclusive roleplaying actions require supporting systems; do not fabricate effects.
- Existing v3 save without `origin04B` stays unchanged and is not silently migrated. Invalid origin payload is refused before runtime restoration; v3 decoder integration remains a separate hardening task.
- Creation flow is currently inside Character > Basic Info, not a new-game wizard.
- 8 and 16 identity catalogs are current proposals and should be adjusted with future lore decisions.
- Source references for design principle: https://www.dndbeyond.com/sources/dnd/br-2024/playing-the-game (species sizes), https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog (modal keyboard and focus).

## Verification
`npm install`, `npm run check`, Playwright smoke; CI statuses are separate from Windows manual browser QA. Do not merge to main until explicit approval.
