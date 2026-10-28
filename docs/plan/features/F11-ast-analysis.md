# F11 — AST analysis

- Module: `docs/plan/modules/05-ast-code-to-spec.md`
- Phase: 2
- Objective: Extract structure and potential behavior from the code.

Phase 2 starts after Phase 1 contracts and deterministic checks exist, and after the Phase 1 benchmark has a measured result. Facts come from the AST, not from comments or the README.

## Plan

Parse each supported source file with a language parser that returns an abstract syntax tree. Store the parser name, the language, the file path, and a hash of the file bytes. When parsing fails, store the parser error and the file path, and skip extraction for that file.

From the tree, list functions and methods, branch conditions, return points, and exception or error paths. Each item stores file and line. A function name is a label. A function named `validate` is recorded as a check only when the tree shows a check on that path. Control flow and data flow cite the AST nodes they came from. A description of the function's purpose is not a flow fact.

Turn each extracted path into one behavior record with three fields: precondition, effect, and failure. A field with nothing extracted stays empty. Requirements, comments, README text, and model text do not fill empty fields.

Compare that record with the requirement, the approved contract, and a README behavior statement by those three fields. Mark each field equal, divergent, or missing. The same words with a different effect are a divergence. A README sentence is not itself a fact. Every fact and every divergence cites a file path and a line. A finding with no location is dropped.

An explanation may sit beside a finding. It leaves the behavior record, the divergence, and the approved contract unchanged. This module reports divergence and does not rewrite contracts.

## Acceptance criteria

- A parsed file stores an AST, a content hash, the parser name, and the language. A parse failure stores the parser error and the path, and that file has no behavior record.
- Every published fact cites a file and a line from the AST. Deleting comments leaves the facts unchanged.
- A function named `validate` whose tree shows no check is listed as a function and is not recorded as a check.
- Each behavior record has only precondition, effect, and failure, and an empty field stays empty after comparison.
- Overlapping wording with a different effect is stored as a divergence, and an explanation does not change the record or the approved contract.

## Evidence

The AST, the extraction lists, the behavior records, and the divergence pairs, each with file, line, and content hash. A parser error is evidence that the file was not understood. An explanation is stored next to a finding and is not evidence. Passing tests are not a proof, and an AST match is not a proof that the approved observables hold.

## Depends on

- Phase 1 contracts and deterministic checks, plus a measured Phase 1 benchmark, before this feature is built.
- F07 for source to parse, identified by a content hash.
- F03 for the approved contract used on the comparison side. The extract does not edit that file.

## Does not include

- Facts taken from comments, from a README sentence, or from a model description.
- Filling an empty behavior field from the requirement text.
- A Phase 1 pass/fail decision, or a rewrite of an approved contract.
- Treating a function name as proof that a check exists.

## Related

- `docs/plan/modules/05-ast-code-to-spec.md`
- F03, F07, F09, F10
- UC-30, UC-31, UC-32, UC-33, UC-34
