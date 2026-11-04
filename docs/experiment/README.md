# Cost, escapes, and false alarms

The plan records four numbers beside the catch list: defect escape, false alarms, cost, and requirement coverage. Coverage is already counted from the contract runs. The other three need evidence this repo does not have yet.

## How to get the real numbers

**Cost.** Time the verification command. If a model was called, add the price from that provider's invoice. A missing invoice stays a gap. It is not zero.

**Escape.** A defect escaped when the gate said PASS and a later commit, a later test, or a production report shows the defect. A FAIL did not escape. Without a later observation there is no escape rate.

**False alarm.** A person reads a FAIL and decides the code meets the approved requirement. Until that person speaks, a FAIL stays a catch. The contract stays the oracle.

## What this repo simulates

`src/experiment/followup.mjs` runs the 20 agent functions against the approved cases.

- Time is the wall clock of that comparison. Price is null.
- Escapes are 0 because all 20 known misses were FAILs and nothing was observed later.
- A false alarm is counted only when every expected value is already present under a different key. The failure is then a renamed field, not a different result.

## Why this is not the review

The plan waits for a person on false alarms and for a later observation on escapes. This simulation forces both with a rule, so it breaks that premise. The result is labeled `manualReview: false`. It does not enter the runner decision and it does not open Phase 2.
