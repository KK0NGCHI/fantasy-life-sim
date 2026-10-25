# 01-A TypeScript engine foundation

This stage adds **only** an independent typed engine contract, compiler configuration and automated smoke tests. It does not connect the game engine to the prototype.

## Guarantees
- Original `index.html`, `src/v3.js` and `src/v8.css` remain unchanged and work with `py -m http.server 8000`, without npm.
- New source: `src/engine/`, strict TypeScript, ES2022 NodeNext ESM; imports use explicit .js extensions.
- `npm run build:engine` writes JS and declarations to untracked `dist/engine/`.
- Compiler pinned at TypeScript 5.8.3, Node 22+. No game dependencies introduced.
- Node built-in test runner checks compiled exports and unchanged UI entrypoint; existing UI CI remains active.

## Developer setup
```powershell
npm install
npm run typecheck
npm run build:engine
npm run test:engine
npm run check
py -m http.server 8000
```
The browser prototype still runs without npm. A package lock should be generated and committed when dependency installation is available. Current dependency is exactly pinned.

## Deferred to subsequent phases
- 01-B: actual dispatch, turn semantics, errors and events.
- 01-C: world-time units, PRNG algorithm and automatic execution.
- 02: runtime validation, IndexedDB and import/export.
- Item quality, stacking, skills and economy formulas remain undecided.

User decision preserved: an accepted in-game failed action consumes 1 turn; malformed or busy technical requests are rejected without consuming turns. These are **types only**; no dispatch currently exists.

## Design authority

The reconciled reference is [Engine 01–02 design](./engine-01-02-design.md). It preserves the user's pasted proposal while overriding undecided alternatives with confirmed decisions: accepted failures spend one turn, IndexedDB + external backup, and TypeScript for the engine. Stage 01-A is a build/type-contract milestone, not a playable action engine.

On macOS, use `python3 -m http.server 8000` to serve the unchanged UI. A `GET /favicon.ico 404` means the browser requested an optional icon that is absent; it does not indicate a game or engine failure. The supplied server log demonstrates HTTP success but does not establish that `npm run check` ran on that Mac.
