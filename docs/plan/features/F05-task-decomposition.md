# F05 — Task decomposition

- Module: `docs/plan/modules/01-task-planning.md`
- Phase: 2
- Objective: Split complex work into checkable subtasks.

Phase 2 starts after the Phase 1 benchmark has a measured result. A split is a proposal until a human accepts it. Correctness stays with module 4.

## Plan

The feature proposes a split from the task and its contract. Each subtask has its own scope and its own named evidence, so it can be checked alone. Work that cannot be checked alone stays one task. A task with no ready E from F04 is not split.

Each subtask names the components and file paths it may touch. That allow-list is the whole scope. The list must be non-empty and narrower than the repository. The coding agent cannot add a path. Module 3 enforces the list.

Every subtask lists four steps in this order: generate, verify, fix, integrate. Generate and fix belong to the coding agent. Verify belongs to module 4. Integrate runs only after verify reports no critical block. A critical security failure blocks the subtask. A shorter schedule leaves that block in place.

A subtask is complete when every evidence name on it is present and tied to the requirement ids it claims. An agent sentence that the work is done does not count. Present evidence still does not prove correctness. The next subtask starts only after the current subtask's contract checks have a result.

## Acceptance criteria

- A sample task yields subtasks that each name a scope and an evidence item, and a sample that cannot be checked alone remains a single task.
- A human acceptance is recorded before the split binds the agent.
- Every emitted subtask has a non-empty allow-list narrower than the repository, and a fixture rejects an empty list or a list that means the whole repository.
- The plan shows generate, verify, fix, integrate in that order, and integrate is absent while verify still has a critical block.
- A missing evidence artifact leaves the subtask incomplete.

## Evidence

The subtask list: parent id, scope allow-list, evidence names, and the four steps. A full set of named artifacts marks the subtask complete for this feature. Passing tests are not a proof of correctness.

## Depends on

- A measured Phase 1 benchmark before this feature is built.
- F04 for a ready E. An open ambiguity withholds that E and withholds the split.
- F03 when the work changes behavior, so the evidence names can cite contract observations.

## Does not include

- The critical path and slack (F06).
- Enforcing the allow-list at runtime (F07).
- Treating a complete subtask list, or an agent summary, as a pass of the parent requirement.
- PERT as a judge of correctness.

## Related

- `docs/plan/modules/01-task-planning.md`
- F03, F04, F06, F07, F10
- UC-38, UC-39
