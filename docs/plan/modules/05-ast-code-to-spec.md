# Module 5 — AST and code-to-spec

Phase 2. Build this after Phase 1 contracts and deterministic checks exist. Feature ids: F11, F12, F13.

This module extracts structured behavior from source code and compares that behavior with requirements, approved contracts, and README statements. Fields count as equal only when precondition, effect, and failure match. An explanation may describe a finding. The finding itself comes from the extract.

## Shared rules

- An AST fact is evidence. An LLM explanation may sit beside that fact and must leave the fact unchanged.
- A function name is a label. Call something validation only when the tree shows a check.
- Compare the behavior records. A sentence that sounds similar is not the comparison.
- Approved contracts stay as approved. This module reports divergence and does not rewrite them.

## Parse with an AST

Parse each supported source file with a language parser that returns an abstract syntax tree. Store the parser name, the language, the file path, and a hash of the file bytes. When parsing fails, store the parser error and the file path, and skip extraction for that file. Later steps add no nodes for a file that failed to parse.

## Extract functions, conditions, returns, and exceptions

From the AST, list functions and methods, branch conditions, return points, and exception or error paths. Each item stores file and line. A function named `validate` is listed as a function. It is recorded as a check only when the tree shows a check on that path.

## Control flow and data flow

Control flow records the branches, loops, and early exits the AST contains, in the order the tree defines. Data flow records where a value is defined and where that value is used inside the function. Each edge cites the AST nodes it came from. A description of the function's purpose is not a flow fact.

## Call graph and dependencies

Each call site records caller, callee, file, and line. A callee resolved inside the repository is in-repo. A callee resolved as an import or package is a dependency, using the name the AST or the manifest shows. An unresolved callee stays unresolved. The graph does not choose a target from the spelling of the callee.

## State mutations and side effects

List writes to fields, collections, files, and databases, and list network calls, clock reads, and uses of randomness. Each item has file and line. A function that returns a value and also writes state stores both facts. When a dynamic call hides the callee's effect, store that the effect is unseen at that boundary.

## Intermediate behavior representation (precondition, effect, failure)

Turn each extracted path into one record with three fields: precondition, effect, and failure. Preconditions are the conditions that guard the path. Effects are the returns, mutations, and side effects on that path. Failures are exception paths, error returns, and explicit failure branches. A field with nothing extracted stays empty. Requirements and model text do not fill empty fields.

## Compare code, requirements, contracts, and README

Reduce each requirement, each approved contract, and each README behavior statement to precondition, effect, and failure. Compare those fields with the code record. Mark each field equal, divergent, or missing. The same words with different fields are a divergence. A README that has no structured behavior statement is missing for that statement, and the code record stays as extracted.

## Semantic divergence

Store a semantic divergence as a pair: the structured statement from the requirement, contract, or README, and the behavior record from the code, plus which field differs. Cite the location of both sides. The code-side record stays as extracted. The pair closes when a later extract on a new content hash matches, or when a human changes the contract through the contract process.

## Evidence tied to file and line

Every extracted fact and every divergence cites a file path and a line or a line range. A finding with no location is invalid and is dropped from the report. For one content hash, parsing again reproduces the same facts.

## An LLM may explain findings and must not replace the extracted evidence

An LLM may attach an explanation to a finding that already has a behavior record and a location. The explanation is a separate field. Comparison, decision state, and the evidence report read the record and the divergence pair. They do not read the explanation. The explanation writer cannot update the AST, the behavior record, the contract, or the requirement.

## Acceptance criteria

- [ ] Each benchmark file ends as an AST plus a content hash, or as a parser error with a file path. An unparsed file has no behavior record.
- [ ] A fixture whose function is named `validate`, and whose tree shows no check, is listed as a function and is not recorded as validation.
- [ ] Control-flow, data-flow, call-graph, mutation, and side-effect items each cite file, line, and the AST node or call site they came from.
- [ ] Each behavior record contains only precondition, effect, and failure, filled from extraction. An empty field is still empty after comparison.
- [ ] Comparison with a requirement, a contract, and a README statement returns equal, divergent, or missing on each field. Overlapping wording with a different effect is divergent.
- [ ] A finding with no file and line is rejected and is absent from the evidence report.
- [ ] Adding an explanation leaves the behavior record, the divergence, and the approved contract byte-for-byte unchanged. The same hash extracts the same facts on a second run.
- [ ] F11, F12, and F13 close only when the checks above pass. An explanation by itself closes none of them.

## Evidence

Evidence is the AST, the extraction lists, the behavior records, and the divergence pairs, each with file, line, and content hash. A parser error is evidence that the file was not understood. An LLM explanation is stored next to a finding and is not evidence.

## Later

Module 6 may pick integration scenarios from these records. A scenario still needs a runtime result before a failure counts. Module 7 may count how many located facts exist when it chooses depth. Module 8 may comment on a divergence after reproducible history exists. That comment leaves the extract unchanged.

## Related files

- `docs/plan/modules/06-integration-search.md` — runtime results for the behaviors extracted here.
- `docs/plan/modules/07-risk-decision.md` — how evidence quantity and quality affect depth and state.
- `docs/plan/modules/08-teacher-learning.md` — later commentary that must not edit these facts.
