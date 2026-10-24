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
- No automatic progression or changed saves, character creation, UI, combat, resource or activity XP payouts: no false claims of full gameplay implementation.

## Compatibility gates
The current runtime v3 envelope and IndexedDB databases are not modified. `skillExperience` in the old runtime is a legacy placeholder; it is not to be populated from the new XP model without an explicit validated schema and opt-in migration.

Before live wiring:
1. Declare versioned v3 progression payload and old-save non-migration policy.
2. Verify engine action events are authoritative before awarding XP, including auto progression and duplicate command retries.
3. Connect only implemented actionable skills first; leave unsupported actions locked or marked pending.
4. Add character creation preview, explicit user acceptance and save/reload tests.
5. Validate Windows Chrome/Edge behavior after engine CI.

References:
- https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB
- https://docs.godotengine.org/en/latest/tutorials/io/saving_games.html
