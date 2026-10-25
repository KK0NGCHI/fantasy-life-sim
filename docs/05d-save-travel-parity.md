# 05-D Integration Stabilization — Save/Travel/Automation Gate

This second gate stacks on Draft PR #64, without a UI redesign or any main-branch merge.

## Contract under test

1. A world saved during gameplay must resume with the same authoritative state as an uninterrupted world that executes the same commands. The test uses the existing approved v2→v3 conversion and strict save-v3 decode, then runs enough world-clock actions to pass a woodland daily transition.
2. A successful game action's returned `nextState` must match the actual state exposed by `current()` after woodland/soil/fungal reconciliation. Rejected commands must not mutate either.
3. Journey management is intentionally separated from actual time-consuming journey advancement: `travelBegin`, `travelPause`, `travelResume` and `travelCancel` alter route state without spending game-time units. A new route begins paused, so `travelResume` is required before `travelSkip`. `travelSkip` is dispatched through the same state reconciliation boundary as other player actions.

## Verified limitation / deferred gates

- Route management changes travel metadata but does not itself consume game time; this is deliberate.
- `workUntil05A` delegates individual attempts to `dispatch('resource.work')`. Automatic UI loops, interrupt policies, route encounters, and power-loss mid-flight are not comprehensively simulated by this slice.
- Existing saves without ecology/site state remain readable; this slice does not silently invent missing woodland state. A previewable opt-in migration is separately required.
- Replaying identical commands verifies deterministic state equivalence, not correctness of the provisional numerical plant/woodland economy.
- Full ecology interface redesign (status labels, pause controls, accessible action feedback) is a later PR.

No gameplay content is added.
