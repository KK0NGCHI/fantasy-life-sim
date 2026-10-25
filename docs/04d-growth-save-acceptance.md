# Somnium 04-D — Save and progression compatibility checkpoint

## Completed in this change
- Optional 04-A progression and 04-B origin are validated by **v3 envelope decoder**, before applying to live state or accepting a backup. Strict expected skill/attribute keys and safe nonnegative numeric ranges; duplicate award IDs rejected; origin body size and exclusive background permission must match registered species/background. Older saves without these optional components remain readable without automatic migration.
- `prepareGrowthUpgrade04D` requires explicit approval, a new slot ID different from the source, a valid origin, and attribute allocation. Creates a *candidate copy* only; it does **not write** to IndexedDB, silently alter the original, or reset current world clock, location, item world, world snapshot, or source slot.
- Regression tests for malformed saves, older v3, roundtrip including one-time background flags, approval and copy-only migration.

## Deferred, not yet completed
- Real user-facing approval dialogue and copying candidate into a new IndexedDB slot; do not claim migrations are offered inside UI. Existing users keep their old saves. 
- Formal save format migration beyond v3 and v2 world-clock migration remain separate.
- Manual Chrome/Edge Windows acceptance and production backup restore drills remain outstanding.
- Data/economy/content state schema improvements for 05-A real resource nodes and object deltas will be addressed with the actual resource system.

## Safety rules
- No merge to main without explicit permission.
- No silent v2-to-v3 conversion and no v3 IndexedDB name or schema changes.
- Copy-first source protection is mandatory; always validate before writing a separate slot.
- In IndexedDB, successful commit must be observed at transaction complete (MDN: https://developer.mozilla.org/en-US/docs/Web/API/IDBTransaction/complete_event ). The current migration preparation does not perform a transaction.
- Automated browser workflows test user-visible actions (Playwright: https://playwright.dev/docs/best-practices ).

## Windows review
```powershell
git fetch origin
git switch feat/04d-save-progression-hardening
git pull --ff-only
npm install
npm run check
py -m http.server 8000
```
