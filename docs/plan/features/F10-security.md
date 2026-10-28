# F10 — Security

- Module: `docs/plan/modules/12-security-audit.md`
- Phase: 1
- Objective: Detect vulnerabilities and authorization failures.

Phase 1 treats a critical security or authorization failure as a block. The block remains when every other check passes. A good score elsewhere does not clear it. The coding agent cannot edit the rule or the contract to remove the block.

## Plan

When the contract marks a claim as a critical security claim, a failure of that claim fails closed. The report still shows the other results. Those results do not clear the block.

When the contract names a permission, an action outside that permission is a critical block. A critical task with no permission claim stays blocked until module 2 records human approval of that omission. Silence is not that approval.

Store the finding, the risk score, and the block as three separate fields. The block stands at any score and with any model. A model may explain the finding. The explanation cannot change the block into a warning.

The authorization property template stays out of the contract schema until F09's hold rule is met. This feature still blocks a detected authorization failure. Isolation, secret handling, and network limits are F28. This feature detects the vulnerability or the authorization failure and applies the block.

Static analysis for a named class earns a suite only after the Phase 1 benchmark shows an escaped defect that unit, integration, regression, and contract checks all missed. Until then, a critical finding from the checks this phase does run is still a block.

## Acceptance criteria

- A fixture with a critical security failure is rejected, the report still shows the other results, and those results do not clear the block.
- An action outside a named permission blocks the run.
- A critical task with no permission claim blocks the run until a named human approval records that omission.
- The finding, the score, and the block are three separate fields, and a low score leaves the block in place.
- A passing unit suite, a passing contract, and a model explanation each leave the block in place.

## Evidence

The finding, the other check results beside it, the score, and the block reason. A reviewer can see that the other results stayed visible and did not clear the block. Passing tests are not a proof and are not a waiver.

## Depends on

- A contract from F03 that can mark a claim critical or name a permission.
- F08 and F09 so their pass results are defined as unable to clear this block.
- Module 2 when a critical task omits a permission claim and needs human approval of that omission.

## Does not include

- A score that turns a critical finding into a warning.
- Adding the authorization template (UC-58) to the contract schema.
- Isolation, secret redaction, and network allow-lists (F28).
- A static-analysis suite before the benchmark escape that module 4 requires.

## Related

- `docs/plan/modules/12-security-audit.md`
- `docs/plan/modules/04-deterministic-verification.md`
- F03, F08, F09, F28, F29
- UC-18, UC-21
