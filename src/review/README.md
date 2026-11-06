# Review log: approval time and false alarms

Records the two numbers `docs/experiment/README.md` says this repo lacks: how long a person takes to review a contract, and which FAILs are false alarms. It does not decide anything. It keeps the evidence and refuses to count the wrong kind.

## Who counts

Every entry carries a `kind`: `human`, `claude` or `subagent`. The report shows all three side by side. **Only `human` entries reach the gate numbers.** A model reading its own contracts and code is not the person the plan waits for. Use `claude` and `subagent` to rehearse the process and to compare, never to open Phase 2.

## Use

```bash
# Time one contract review. The clock runs from start to done; minutes cannot be typed in.
node src/review/cli.mjs start RF-01 --by ana --kind human
node src/review/cli.mjs done  RF-01 --verdict approve --note "case at 30 percent is missing"

# See the FAILs a person must read: sentence, case input, wanted and got values.
node src/review/cli.mjs queue --contracts experiments/tasks --functions experiments/agent-fns.mjs --export fns --sentences experiments/tasks

# Record the reading of one FAIL. A note is required.
node src/review/cli.mjs alarm RF-01 --by ana --kind human --judgement false_alarm --note "right discount under another key"

# Times and alarms per kind, and the gate numbers.
node src/review/cli.mjs report --contracts experiments/tasks --functions experiments/agent-fns.mjs --export fns
```

The log is `docs/experiment/review-log.jsonl`, append-only. Pass `--log FILE` to keep a rehearsal apart from the real run.

## Screen

`npm run dev`, then open `http://localhost:3000/review`. Type your name, review each contract with the timer running, then read each FAIL with the code beside what the contract wanted. The screen writes to the same log as the commands. `REVIEW_LOG` and `REVIEW_KIND` environment variables point a rehearsal at another file and another kind; the default is the real log and `human`.

## Judgements

| Value | Meaning |
| --- | --- |
| `defect` | The code does not meet the approved requirement. The FAIL is a catch. |
| `false_alarm` | The code meets the approved requirement. The contract and the code disagree only in form. |
| `unclear` | The FAIL says nothing about the logic, for example the function never received usable input. |

A FAIL stays a catch until a person says otherwise. The latest entry for a contract replaces the earlier one.

## What stays null

A gate number that needs every contract reviewed stays `null` until every contract is. `reviewed: "3/20"` is a partial run, not a median. The same holds for false alarms: they count only when a human judged every FAIL.

## What a rehearsal showed

Running `queue` on the 20 original agent functions shows that every FAIL is an interface mismatch: the function expects other input names than the contract gives, or returns its answer under another key. In 16 of the 20 the function got nothing usable or returned nothing under the contract's key, so the FAIL says nothing about the logic. A person reading them should expect to answer `unclear` or `false_alarm` far more often than `defect`. Count them as catches only after that reading.

Times from a `claude` rehearsal are near zero because nothing was read between `start` and `done`. They show the log works, not how long a review takes.

## Files

| File | Job |
| --- | --- |
| `ledger.mjs` | Append and read the log, time reviews, build the report. |
| `cli.mjs` | The commands above. |

Tests: `test/review-ledger.test.mjs`.
