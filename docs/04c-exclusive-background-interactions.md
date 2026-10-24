# Somnium 04-C — background-only regional insight actions

## Scope and design sources
- Background creates lasting exclusive *ways of interpreting the world*, rather than an immediately interchangeable XP bonus.
- Larian explains origin characters as bringing distinct personal histories and world interactions: https://larian.com/support/faqs/gameplay-information_52
- Baldur's Gate 3 background decisions have distinctive narrative responses (not identical mechanics to Somnium): https://blog.playstation.com/2023/09/14/how-your-choices-in-baldurs-gate-3s-character-creator-carry-through-your-entire-playthrough/
- W3C native dialog guidance: https://www.w3.org/WAI/WCAG22/Techniques/html/H102
- Somnium reuses its existing region-view interaction buttons rather than opening a redundant modal.

## Implementation contract
- `src/origin-interactions-04c.js`: exactly 16 fixed contextual recognition interactions (one per background), with specified parent region and meaningful interpretation text.
- `src/main-v2-inventory.js`: `origin.insight` registered in the central action dispatcher, consumes 60 in-game seconds on the first valid successful completion, emits `origin.insight_discovered`.
- Only a character with the exact matching immutable `origin04B.exclusiveAbilityId` and located in the right region may perform the action.
- One-time record persists in `state.flags['origin-insight:'+interactionId]`, which the existing v3 save already serializes as booleans. Repeated execution is rejected without changing the game clock or state.
- UI displays the one available action in the matching region, disables after discovery, and shows the actual interpreted clue as a log entry.
- **No additional tiles, no procedural sub-tiles, no region-graph change, no fake encounter, gold, inventory reward, combat, XP or NPC behavior.**

## Not implemented
- NPC reputation, conversations, actual secret-market inventories, recipes, routes, relic recovery, background quests and physical-sized gear: these require corresponding authoritative game systems.
- Background insight is meaningful persistent flavor and first exploration behavior, not an entire background campaign.
- Previous v3 saves are never silently assigned a new origin or discovery flag; invalid origin payload is blocked during current runtime restoration, with save-envelope decoder validation requiring later hardening.
