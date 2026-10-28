# F12 — Flow analysis

- Module path: `docs/plan/modules/05-ast-code-to-spec.md`
- Phase: 2
- Objective: Study dependencies, data, and execution paths.

Phase 2 reads the AST from F11. Dependencies, data flow, and execution paths are facts from that tree. A function name, a comment, a README sentence, and a model explanation are not flow facts.

## Plan

Control flow lists the branches, loops, and early exits the tree contains, in the order the tree defines. Each edge cites the file, the line, and the AST node. An order the tree does not define is left unstated.

Data flow lists where a value is defined and where that value is used inside the function. A claim that a check is implemented cites this path. The claim is dropped when the value is not followed to the check.

The call graph records caller, callee, file, and line at each call site. A callee resolved inside the repository is in-repo. A callee resolved from an import or a package manifest is a dependency, under the name the tree or the manifest shows. An unresolved callee stays unresolved. Spelling does not pick a target.

Writes to fields, collections, files, and databases, and network calls, clock reads, and uses of randomness, are stored with file and line. A function that returns a value and also writes state stores both. When a dynamic call hides the callee's effect, the effect is stored as unseen at that boundary.

Parsing again for the same content hash reproduces the same edges. An explanation may sit beside the model and leaves every edge unchanged.

## Acceptance criteria

- A branch, a loop, and an early exit each cite file, line, and the AST node, in tree order.
- A value used in a check cites the definition and the use. With no such path, the check is not recorded as implemented.
- An in-repo callee, a manifest dependency, and an unresolved callee are three different results. The unresolved callee has no guessed target.
- A function that returns and writes stores both facts. A dynamic call stores the effect as unseen.
- A second extract of the same hash matches the first. An added explanation does not change the edges.

## Evidence

Re-parse the fixture and diff the flow lists. The evidence is those lists, each with file, line, content hash, and AST node. A model explanation is stored beside them and is not evidence. An LLM explanation cannot replace the AST facts or the test result.

- Diff control-flow, data-flow, and call-graph rows against the golden list checked from the tree.
- Run the fixture that deletes one call. The edge is gone in the new extract. Archive that test result.
- Run the unresolved-callee fixture. Archive the unresolved row and the absence of a guessed target.
- Run the dynamic-call fixture. Archive the unseen-effect row.

## Depends on

- F11 for a parsed tree, or a parser error that skips extraction, with parser name, language, path, and content hash.
- `docs/plan/modules/05-ast-code-to-spec.md` for the flow, call-graph, and side-effect rules.

## Does not include

- Filling behavior fields from requirements or model text (F11, F13).
- Deciding equal, divergent, or missing against a requirement (F13).
- Integration runs, fuzzing, and fault injection (F14, F15).
- Genetic search, risk scores, and verdicts (F16, F17, F18).

## Related

- `docs/plan/modules/05-ast-code-to-spec.md`
- F11, F13, F14, F17
- UC-28, UC-31
