# Somnium 04-A: independent skills and attributes — implementation foundation

## Fixed design decisions
- No global character level.
- 54 independent skills in six groups, seven trainable attributes.
- Level 30 is the normal content milestone, not a maximum; higher levels remain possible with diminishing gameplay benefits capped per effect.
- No carried weight/capacity; light/heavy armor identity is item material and construction category, not total equipped weight.
- 3 deep-field activities still require exploration + associated skill; existing numerical requirements are placeholders.
- Selected professions only, not all 54 skills, will eventually use choice-based specializations.

## What this PR implements
- `src/progression-system.js` exports the complete immutable 54-skill registry, attributes, numeric trial rules, skill XP-to-level conversion, diminishing overlevel example, attribute creation budget, training milestones, validation, and idempotent event-key XP awarding.
- A 7-attribute creation preview: base 10 each, allocate up to 10 points, no initial value above 15.
- Trial next-level XP formula `60 + 12*(L-1) + 3*(L-1)^2`, 30 level at 29,754 cumulative XP.
- Attribute training progress uses a separate point system; skills are the primary advancement.
- Tests for consistent registry, level 30/31+, state immutability and idempotent rewards.
- Current v3 **new-game runtime opt-in** now initializes `progression.system04A`, preserves it across v3 save/restore, and displays 54 skills and 7 attributes in the existing 숙련 UI. Legacy saves without this optional state stay legacy; no automatic migration.\n- `탐색` receives 1 XP per newly discovered dungeon tile after confirmed local action. Re-entering previously seen cells grants nothing. The provisional 10/10 deep-field gates now read real skill levels for opt-in characters rather than placeholder UI values.\n- Other life/region actions, combat, gathering, crafting, etc. still do **not** award XP until their results are authoritative. Character creation allocation UI and balance decisions remain pending. The 10 points are allocated via engine API, not an exposed player setup screen.

## Compatibility gates
The current runtime v3 envelope and IndexedDB databases are not modified. `skillExperience` in the old runtime is a legacy placeholder; it is not to be populated from the new XP model without an explicit validated schema and opt-in migration.

Before live wiring:
1. Harden optional v3 progression payload validation in the save envelope itself, beyond the current validation at live restore. Add explicit approved migration flow for old slots (never silently rewrite).
2. Extend authoritative action-based XP beyond validated exploration discovery, including auto progression and duplicate command retries.
3. Connect only implemented actionable skills first; leave unsupported actions locked or marked pending.
4. Add character creation preview, explicit user acceptance and save/reload tests.
5. Validate Windows Chrome/Edge behavior after engine CI.

References:
- https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB
- https://docs.godotengine.org/en/latest/tutorials/io/saving_games.html
