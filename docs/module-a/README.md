# Module A — Contract representation

**Task:** Decide how a requirement becomes a contract that a coding agent cannot grade itself against.

**Status:** Decision for the first experiment. No runner, no solver, no template library.

## Decision

Author contracts in YAML. Validate the envelope with JSON Schema. Check cross-field contradictions with a short list of structural rules. Allow only closed fields: declared inputs, declared observables, numeric input constraints, example cases, and one property template (`bounded_output`).

A critical contract carries `gate: block`. A later risk score cannot turn that block into a warning.

The coding agent may read a contract. It may not edit `contracts/`. In this phase the freeze is git: any diff under `contracts/` after approval invalidates the run.

## Options considered

| Option | What it is good for | Limit that keeps it out of this phase |
| --- | --- | --- |
| YAML + JSON Schema + closed fields | A human can review a diff. A schema can reject a broken envelope before any test runs. | Cannot express an arbitrary predicate. |
| JSON Schema alone | Strict structure and existing validators. | Noisy diffs. Poor as the document a person approves. |
| YAML alone | Fast to write. | An invalid contract reaches execution. |
| OpenAPI or Pact | Request and response shapes. | No approval freeze, no gate, no "balance unchanged and no transaction". |
| Custom contract DSL | A syntax fitted to this product. | A parser and a second language before a single measured catch. |
| TLA+, Alloy, or Dafny | Proofs, when the property is mathematical and the team can write the spec. | Authoring cost before any evidence that contracts catch agent mistakes. |
| Z3 now | Satisfiability of free logical constraints. | This phase has no free constraints. Constant comparisons cover the contradictions we can define. |

Z3, a custom DSL, and further property templates stay out until the experiment below produces a miss that those tools would have caught.

## What a contract is in this phase

One file is one requirement. The file records the observable outcome that matters, the evidence that must exist, what the contract does not check, and who approved it.

Preconditions apply to every case. A case whose input violates a precondition is an invalid contract, not a test of error handling. Error behavior is written as its own case with inputs that satisfy the preconditions.

`bounded_output` on one field is not enough when the requirement is a rejection. The overdraft contract also records that the status is `REJECTED`, the balance is unchanged, and no transaction is created. Those are separate observables.

## Example

`contracts/RF-01.yaml` for the experiment:

```yaml
id: RF-01
name: Reject a transfer above the available balance
priority: critical
gate: block
revision: 1
approval:
  status: approved
  by: product-owner
target:
  operation: transfer
  inputs: [balance, amount]
observables:
  - name: status
    type: string
    values: [REJECTED, ACCEPTED]
  - name: balance_unchanged
    type: boolean
  - name: transaction_created
    type: boolean
  - name: balance_after
    type: number
preconditions:
  - id: amount-positive
    type: input_constraint
    field: amount
    operator: gt
    value: 0
  - id: balance-non-negative
    type: input_constraint
    field: balance
    operator: gte
    value: 0
cases:
  - id: overdraft-rejected
    input:
      balance: 100
      amount: 150
    expected:
      status: REJECTED
      balance_unchanged: true
      transaction_created: false
properties:
  - id: no-negative-balance
    template: bounded_output
    field: balance_after
    min: 0
evidence:
  minimum:
    - kind: example_case
      ref: overdraft-rejected
    - kind: property
      ref: no-negative-balance
limitations:
  - Does not define currency, concurrency, persistence, or how a transaction is stored.
  - balance_after >= 0 alone does not show that the transfer was rejected.
```

A second case that belongs in a later revision, not in this file until someone approves it: a transfer of 20 from 100 returns `ACCEPTED`, decreases the balance by 20, and creates one transaction. That case is a different claim. Leaving it out is a stated limitation of revision 1, which only freezes the rejection.

## Envelope schema

Save as `contracts/contract.envelope.schema.json`. It checks shape. It does not check that a case agrees with a precondition. That is the structural pass.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://ai-skill-reviewer.local/contract.envelope.schema.json",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "id", "name", "priority", "gate", "revision", "approval",
    "target", "observables", "preconditions", "cases",
    "properties", "evidence", "limitations"
  ],
  "properties": {
    "id": { "type": "string", "pattern": "^RF-[0-9]{2,}$" },
    "name": { "type": "string", "minLength": 1 },
    "priority": { "enum": ["critical", "normal"] },
    "gate": { "enum": ["block", "report"] },
    "revision": { "type": "integer", "minimum": 1 },
    "approval": {
      "type": "object",
      "additionalProperties": false,
      "required": ["status", "by"],
      "properties": {
        "status": { "enum": ["draft", "approved"] },
        "by": { "type": "string", "minLength": 1 }
      }
    },
    "target": {
      "type": "object",
      "additionalProperties": false,
      "required": ["operation", "inputs"],
      "properties": {
        "operation": { "type": "string", "minLength": 1 },
        "inputs": {
          "type": "array",
          "minItems": 1,
          "uniqueItems": true,
          "items": { "type": "string", "minLength": 1 }
        }
      }
    },
    "observables": {
      "type": "array",
      "minItems": 1,
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["name", "type"],
        "properties": {
          "name": { "type": "string", "minLength": 1 },
          "type": { "enum": ["number", "boolean", "string"] },
          "values": {
            "type": "array",
            "minItems": 1,
            "items": { "type": "string" }
          }
        },
        "allOf": [
          {
            "if": {
              "properties": { "type": { "const": "string" } },
              "required": ["type"]
            },
            "then": { "required": ["values"] }
          }
        ]
      }
    },
    "preconditions": {
      "type": "array",
      "items": { "$ref": "#/$defs/inputConstraint" }
    },
    "cases": {
      "type": "array",
      "minItems": 1,
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["id", "input", "expected"],
        "properties": {
          "id": { "type": "string", "minLength": 1 },
          "input": {
            "type": "object",
            "additionalProperties": { "type": ["string", "number", "boolean", "null"] }
          },
          "expected": {
            "type": "object",
            "minProperties": 1,
            "additionalProperties": { "type": ["string", "number", "boolean", "null"] }
          }
        }
      }
    },
    "properties": {
      "type": "array",
      "items": { "$ref": "#/$defs/boundedOutput" }
    },
    "evidence": {
      "type": "object",
      "additionalProperties": false,
      "required": ["minimum"],
      "properties": {
        "minimum": {
          "type": "array",
          "minItems": 1,
          "items": {
            "type": "object",
            "additionalProperties": false,
            "required": ["kind", "ref"],
            "properties": {
              "kind": { "enum": ["example_case", "property"] },
              "ref": { "type": "string", "minLength": 1 }
            }
          }
        }
      }
    },
    "limitations": {
      "type": "array",
      "minItems": 1,
      "items": { "type": "string", "minLength": 1 }
    }
  },
  "allOf": [
    {
      "if": {
        "properties": { "priority": { "const": "critical" } },
        "required": ["priority"]
      },
      "then": {
        "properties": { "gate": { "const": "block" } }
      }
    }
  ],
  "$defs": {
    "inputConstraint": {
      "type": "object",
      "additionalProperties": false,
      "required": ["id", "type", "field", "operator", "value"],
      "properties": {
        "id": { "type": "string", "minLength": 1 },
        "type": { "const": "input_constraint" },
        "field": { "type": "string", "minLength": 1 },
        "operator": { "enum": ["gt", "gte", "lt", "lte", "eq"] },
        "value": { "type": "number" }
      }
    },
    "boundedOutput": {
      "type": "object",
      "additionalProperties": false,
      "required": ["id", "template", "field", "min"],
      "properties": {
        "id": { "type": "string", "minLength": 1 },
        "template": { "const": "bounded_output" },
        "field": { "type": "string", "minLength": 1 },
        "min": { "type": "number" },
        "max": { "type": "number" }
      }
    }
  }
}
```

`priority: critical` with `gate: report` fails this schema. A draft contract can be stored. It cannot count as a pass in the experiment.

## Structural rules

Apply these by hand, or with a script no longer than a single check per rule, before any implementation runs. Stop at the first failure.

1. `approval.status` is `approved`.
2. Every `evidence.minimum` ref exists as a case id or a property id of the matching kind.
3. Every precondition `field` is in `target.inputs`.
4. Every case `input` key is in `target.inputs`.
5. Every case `expected` key and every property `field` is an observable name.
6. An expected string is one of that observable's `values`.
7. If a precondition compares an input to a constant, every case input satisfies it. `amount: -50` with `amount > 0` invalidates the contract.
8. For `bounded_output`, `min <= max` when `max` is present.
9. A critical contract's cases include the failure outcome the requirement talks about, not only a bound on one number. If they do not, the contract is invalid until `limitations` names the missing observable and `priority` is lowered to `normal`, or the case is added and `revision` increments.

Rule 9 is the one that rejects "balance_after >= 0" as a complete statement of "reject the transfer".

## Freeze

| Rule | Check |
| --- | --- |
| Approved text is the oracle | The agent prompt contains the natural-language requirement and does not contain the YAML. |
| The agent does not edit the oracle | `git diff` on `contracts/` is empty at the end of the run. A diff invalidates the run. |
| A real change is a new revision | A human edits the file, increments `revision`, and sets `approval.by` again. |

There is no signature service in this phase. The git blob of the approved file is the identity.

## Acceptance criteria

1. RF-01 validates against the envelope schema.
2. The same file with `gate: report` fails schema validation.
3. The same file with a case `amount: -50` fails structural rule 7 and never runs against code.
4. A file whose only check is `balance_after >= 0`, with no expected status, unchanged balance, or transaction flag, fails structural rule 9.
5. A run where the agent modifies `contracts/RF-01.yaml` is invalid, including when the new file would make the implementation pass.
6. Each contract has a non-empty `limitations` list.
7. Evidence refs that point at a missing case or property fail structural rule 2.

## Experiment

**Name:** Frozen-contract catch rate.

**Question:** After a contract is approved and hidden from the coding agent, how often does it fail an implementation whose own tests pass?

**Corpus:** 20 tasks. Each task is one function, one ambiguous English requirement, and one contract written and approved before the agent runs. The experimenter also writes one seeded wrong implementation that matches the likely misreading. Example of the misreading: "allow discounts up to 30%" implemented as "always take 30% off".

**Runs, in order:**

1. Structural pass on the contract. Failures here are bad contracts, not product bugs.
2. Execute the contract cases against the seeded wrong implementation. If they pass, mark the contract weak.
3. Give the agent only the ambiguous sentence. Let it write the function and its tests. It must not receive or edit the YAML.
4. Run the agent's tests. Run the contract cases against the agent's function. A human records whether the function matches the approved observables.

**Counts:**

| Symbol | Meaning |
| --- | --- |
| W | Contract passes the seeded wrong implementation. |
| C | Contract is not weak, agent tests pass, contract cases fail. |
| F | Contract cases pass, and the human judges the function wrong against the approved observables. |
| M | Minutes to write and approve one contract. |

**Pre-registered rule, fixed before looking at the 20 results:**

- Build a runner only if `C >= 10`, `F <= 2`, `W <= 3`, and median `M <= 25`.
- If `W > 3`, change the contract vocabulary and repeat this experiment. Do not build a runner.
- If `C < 10` because the agent's own tests already fail the bug, this layer is not adding detection. Do not build a runner for that claim.
- Add Z3 only if a contract passes rules 1–9 and a reviewer can show a contradiction those rules cannot see, more than once in the 20.
- Add another property template only when a task in this corpus cannot state its observable outcome with cases plus `bounded_output`.

A runner, a gateway, and a UI are justified by those numbers. They are not part of this README.

## Limitations of this decision

- Twenty seeded tasks will overstate the catch rate relative to a real repository.
- The person who writes the contract also writes the seeded bug, so W is a weak estimate of vacuous contracts.
- Case execution still needs a human or a throwaway harness. This document does not specify that harness.
- A passing contract is evidence about the listed observables. It is not a proof that the program is correct.
- Idempotency, authorization, atomicity, and state transitions are unnamed in the schema on purpose. They enter when a measured task needs them.
