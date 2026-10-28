# F13 — Code-to-spec

- Module path: `docs/plan/modules/05-ast-code-to-spec.md`
- Phase: 2
- Objective: Compare code behavior with requirements and documentation.

Comparison uses structured behavior. A wording difference alone is not a contradiction. Fields count as equal only when precondition, effect, and failure match.

## Plan

Take each code path's behavior record from the extract: precondition, effect, and failure. Preconditions are the guards on that path. Effects are the returns, mutations, and side effects. Failures are exception paths, error returns, and explicit failure branches. An empty field stays empty. Requirement text does not fill it.

Reduce the requirement, the approved contract, and each README behavior statement to the same three fields. Compare field by field. Mark each field equal, divergent, or missing.

The same three fields are equal when the sentences use different words. That pair is not a contradiction. The same words with a different effect are a divergence. Store the divergence as both structured statements, the field that differs, and the file and line of both sides.

A README with no structured behavior statement is missing for that statement. The code record stays as extracted. A finding with no file and line is dropped.

The approved contract is not rewritten. The pair closes when a later extract on a new content hash matches, or when a human changes the contract through the contract process. An explanation may describe the pair and cannot update the record, the divergence, the contract, or the requirement.

## Acceptance criteria

- A wording mismatch with the same precondition, effect, and failure is equal on all three fields and stores no contradiction.
- Overlapping wording with a different effect is divergent on effect, with both locations.
- An empty extracted field is still empty after comparison, and a missing README statement is marked missing.
- A divergence without file and line is rejected and is absent from the stored pairs.
- Adding an explanation leaves the behavior record, the divergence, and the approved contract unchanged.

## Evidence

The evidence is the behavior records and the divergence pairs, each with file, line, and content hash. Re-run the comparison and diff the pairs. An LLM explanation cannot replace those pairs or the AST facts they cite.

- Run the wording-only fixture. Archive equal on all three fields.
- Run the effect-mismatch fixture. Archive one divergent effect and both citations.
- Run the empty-field fixture. Archive the empty field and the missing mark.
- Repeat the comparison on the same hash. The pairs match the first run.

## Depends on

- F11 and F12 for located facts and for behavior records that contain only precondition, effect, and failure.
- Approved contracts and requirements that can be cited, from `docs/plan/modules/05-ast-code-to-spec.md`.

## Does not include

- Parsing source or adding nodes for a file that failed to parse (F11).
- Call-graph and data-flow extraction (F12).
- A runtime pass or fail. A divergence is a located pair, not a Phase 1 state (F18).
- Rewriting an approved contract, or treating a model summary as the code-side record.

## Related

- `docs/plan/modules/05-ast-code-to-spec.md`
- F11, F12, F18, F19
- UC-32, UC-33, UC-34
