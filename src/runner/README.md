# Contract runner

Checks functions against approved contracts, and checks whether a contract lets a wrong implementation through. It reads contract files and a module of functions. It knows nothing about the RF corpus, so it can be pointed at another project.

```bash
# Do the functions meet every case and property? Exit 1 unless all PASS.
node src/runner/cli.mjs run --contracts experiments/tasks --functions experiments/agent-fns-fixed.mjs --export fixedFns

# Does the contract catch these wrong implementations? Exit 1 if any SURVIVES.
node src/runner/cli.mjs counterexamples --contracts experiments/tasks --file counterexamples.json
```

Add `--json` for machine output, `--call positional` when the functions take arguments in the order of `target.inputs`, and `--epsilon 1e-9` to forgive float noise (the default is exact equality).

## What each result means

| Result | Meaning |
| --- | --- |
| `PASS` | Every case matches and every property holds on every case input. |
| `FAIL` | A case result differs, a property is violated, or the function threw. |
| `UNKNOWN` | The contract has a property type the runner cannot check. Not a pass. |
| `MISSING` | No function was found for the contract id. |
| `SURVIVES` | A counterexample passes the whole contract: the contract is weak against it. |
| `CAUGHT` | A case or property rejects the counterexample. |

`PASS` says the function meets the contract. It does not say the function meets the requirement. `CAUGHT` for every known counterexample does not prove the contract is complete.

## What changes in each project

Everything in this table is project work. The runner code does not change.

| Item | Where it lives | What to decide |
| --- | --- | --- |
| Contracts | a folder of `*.yaml` | The cases, properties and observables. This is the oracle. |
| Contract ids | `id` in each file, `contracts/contract.envelope.schema.json` | The schema pattern is `^RF-[0-9]{2,}$`. Change it for other ids, or the schema check rejects them. The runner only needs ids to be unique and sortable. |
| Functions under test | a module, `--export NAME` | An object keyed by contract id, or an array in id order. |
| Input and output names | each contract | Functions must use the contract's input names and observable names, or the case fails on a name mismatch. |
| Call shape | `--call` | `object` passes the input record. `positional` passes values in the order of `target.inputs`. |
| Float tolerance | `--epsilon` | Money and rates usually need one. |
| Open choices in the requirement | comments in the functions | Where the sentence does not decide (a limit, a threshold, a unit), the function picks and says so. The RF corpus marks these `CHOICE`. |
| Edge tests | the project's own tests | `test/agent-fns-fixed.test.mjs` lists boundaries for the 20 RF requirements. It is not reusable. Write new ones. |
| Counterexamples | a JSON array of `{ id, label, source }` | Wrong implementations written by a reviewer. |
| Review rubric | `docs/experiment/review-rubric.md` | The text is generic. Re-read its "never a reason to reject" list: the `floor` property and `gte 0` inputs are conventions of this corpus. |
| Reviewers | outside this repo | The RF run used subagents. A subagent time is not a human approval time. |

## What does not change

- The contract format: `target.inputs`, `cases` with `input` and `expected`, `properties` of template `bounded_output` with `field`, `min` and optional `max`.
- The rubric's one question: can an implementation break the sentence and still pass every case and property?
- The result words above.

## Limits

- Only the `bounded_output` property template is checked. Anything else gives `UNKNOWN`.
- A property is checked on the case inputs only. It is not a search over other inputs.
- Preconditions are not enforced on the function. `src/contracts/check.mjs` already checks that case inputs satisfy them.
- A property field the function does not return is a violation. Counterexample runs relax this and report `propertyFieldAbsent`, because a reviewer's sketch often omits unused fields.
- Counterexample `source` text is executed with `new Function`. Run only files you wrote or reviewed.
- Bare results (a number instead of a record) are wrapped under the first expected key in counterexample runs only. A function under test must return a record.

## Files

| File | Job |
| --- | --- |
| `contracts.mjs` | Load a folder of contracts, ordered by id. |
| `functions.mjs` | Load a module and map functions to contract ids. |
| `evaluate.mjs` | Evaluate cases and properties, and run counterexamples. |
| `cli.mjs` | The two commands above. |

Tests: `test/runner.test.mjs` uses a made-up shipping-fee contract, so it shows the runner working outside the RF corpus.
