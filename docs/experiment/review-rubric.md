# Contract review rubric

One question decides the verdict: **can an implementation break the sentence and still pass every case and property in the contract?**

## Procedure

1. Read the one-sentence requirement (`experiments/tasks/RF-XX.txt`) and the contract (`RF-XX.yaml`).
2. Name the key rule in the sentence (a limit, a threshold, an order, a condition, a result).
3. Try to write a short implementation that violates that rule but returns the expected value for every `case` and satisfies every `property`.
4. If you can, the verdict is **REJECT** and you must give that implementation as `counterexample`.
5. If you cannot, the verdict is **APPROVE**, even if the contract is thin.

## Also REJECT

- **Contradiction.** A case or property says something the sentence rules out. Quote both.
- **Hidden ambiguity.** The sentence allows two readings, the contract's own cases only fit one, and `limitations` does not name the choice.

## Never a reason to reject

- The template parts that every contract carries: a `floor` property (`bounded_output`, `min: 0`), `gte 0` input constraints, a `seen` observable of the same kind, the standard `limitations` line.
- Having only one case, when step 3 finds no counterexample.
- Units, rounding or precision the sentence does not mention.
- Edge cases you would like to see but that no counterexample needs.

## Output

Write JSON: `{"id","reviewer","start","end","verdict":"APPROVE|REJECT","keyRule","counterexample":null|"<js function>","reasons":[...]}`. `start` and `end` come from `node -e 'console.log(Date.now())'`, run first and last.
