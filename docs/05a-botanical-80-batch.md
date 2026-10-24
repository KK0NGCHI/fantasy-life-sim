# 05-A botanical batch expansion: 80 species candidates

80 data records: 6 previously curated with individual source links; 74 additional candidates marked `reviewStatus: provisional`. The 74 were rapidly mapped from the research backlog to binomial candidate names, **not independently verified one by one**. `researchSource` is the taxonomy directory, not an assertion of record-level validation. Ecology/season/rarity weights are gameplay proposals.

Data: `src/botanical-species-05a.js` (six curated + all aggregation), `src/botanical-backlog-05a.js` (74 provisional), `src/activity-tables-05a.js` (regional conditional rolls).

- 80 species item identities registered in the inventory catalog; no save schema migration.
- `harvestMode:'observe'` for bluebell and wild orchid candidates; excluded from random material payout while remaining definable catalog items.
- 74 provisional entries must be individually reviewed for taxonomy, habitat, aliases, conservation, safety and in-game gathering role.
- The 80 species are **not** claimed to be 80 scientifically validated species of a single local biome; these include wetland, alpine, coastal, arid and temperate species.
- Current pool structure uses one common tier. Its existing-resource weight 4 vs individual botanical weight 1 is a test configuration, not approved balancing.
- Regions and seasons are game-design assignments; weather and altitude climate remain unimplemented prerequisites.
- Existing candidates do not have species-specific regeneration nodes: incidental reward pools only.
- We deliberately did not equate observed plant species with real-world medicinal or edible safety.

Baseline refs: [RHS meadow plant lists](https://www.rhs.org.uk/wildlife/lawn-and-mini-meadow-habitats), [Woodland Trust wildflowers](https://www.woodlandtrust.org.uk/trees-woods-and-wildlife/plants/wild-flowers/), [Kew POWO](https://powo.science.kew.org/).
