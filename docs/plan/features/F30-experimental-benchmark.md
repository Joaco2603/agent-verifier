# F30 — Experimental benchmark

- Module: `docs/plan/modules/04-deterministic-verification.md`
- Phase: 1
- Objective: Measure gains against existing tools and tests.

## Plan

The benchmark measures this gate against tools and tests that already exist. The primary comparison is defects this gate catches that the agent's own tests pass. Those catches are the gain. A higher pass rate is not the gain.

Four other numbers are recorded beside that comparison, each kept separate:

- Defect escape: defects that left the gate and showed up later.
- False alarms: failures the gate reports that are not defects.
- Cost: verification cost for the run, as time plus any price already logged. A missing price is a gap, not a zero.
- Requirement coverage: how many requirements passed, failed, or were too vague to check.

Public benchmarks do not stand in for this comparison. They may shortlist a model elsewhere. They are not the baseline here.

The Module A rule for building a runner stays a separate decision that reads this benchmark: at least 10 of those catches, at most 2 false accepts, at most 3 weak contracts, and a median approval time of 25 minutes or less. This feature records the inputs. It does not start the runner by itself.

A model explanation of the table does not change a cell. Critical security failures stay visible in the table. They are not folded into a single score.

## Acceptance criteria

- The report lists defects the gate caught while the agent's own tests passed, with the contract id and the raw result for each.
- Escape, false alarms, cost, and requirement coverage each have their own number and their own definition on the report.
- Pass rate is absent from the gain column.
- A run with no recorded cost stores a gap. It does not store zero unless the measured cost was zero.
- The four Module A thresholds are computed from these rows and labeled as the runner decision, not as a quality score.

## Evidence

- The catch list: gate result, agent-test result, contract revision, seeded or observed defect id.
- The four accompanying counts, with the cases behind escape and false alarms.
- The cost note: what was measured, and what was missing.

## Depends on

- Frozen contracts and deterministic checks that finish as pass, fail, unknown, or not applicable.
- The agent's own tests, run on the same change, as the baseline.
- A defect id that both sides can share, so a catch is the same defect and not a renamed one.

## Does not include

- A genetic search, a fuzzer, or a public leaderboard as the baseline.
- A blended score that can hide a critical miss.
- The commercial claim that someone would pay (F34). That study may read this report. It is not part of the table.
- Training a model on the benchmark rows.

## Related

- `docs/plan/modules/04-deterministic-verification.md`
- `docs/module-a/README.md`
- F31, F33, F34, F26
- UC-60, UC-61, UC-62
