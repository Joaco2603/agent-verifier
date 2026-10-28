# F06 — Dependency graph

- Module: `docs/plan/modules/01-task-planning.md`
- Phase: 2
- Objective: Order tasks and identify the critical path.

Phase 2 starts after the Phase 1 benchmark has a measured result. The graph orders checkable subtasks. The path is a schedule. PERT does not judge correctness.

## Plan

Take the subtasks and predecessor links from F05. A dependency is a directed edge: a subtask starts only after the subtasks it names are complete. Give each node the expected duration E from F04.

The critical path is the path with the largest sum of expected durations. Publish that path, the order, and the E used on each node. A cycle or a missing predecessor is reported in place of a path. That graph gets no order.

Store the result outside `contracts/`. The order does not change a contract gate, a test result, or a security block. A task on the critical path still waits for its own checks. A shorter path leaves a critical security block in place.

## Acceptance criteria

- A fixture graph names the critical path from the E values, and that path is the largest sum of expected durations.
- A cycle is reported in place of a path.
- A missing predecessor is reported in place of a path.
- Every subtask from F05 appears once, and a published order exists only when the graph has neither a cycle nor a missing predecessor.
- The graph output has no pass/fail on source code and no edit under `contracts/`.

## Evidence

The node list, the edges, the E on each node, and either the critical path or the cycle or missing-predecessor report. A reviewer can recompute the largest sum from the E values. The path is evidence about schedule. Passing tests are not a proof, and a short path is not a pass.

## Depends on

- F05 for the subtasks and the predecessor links.
- F04 for E on each node. A node with no ready E does not enter a published path.
- A measured Phase 1 benchmark before this feature is built.

## Does not include

- Estimating O, M, and P (F04) and proposing the split (F05), except as inputs.
- A correctness, security, or contract verdict.
- Reordering tasks in order to hide a failed check.
- Automatic model routing (F25).

## Related

- `docs/plan/modules/01-task-planning.md`
- F04, F05, F07, F10
- UC-39
