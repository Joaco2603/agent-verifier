# F34 — Commercial validation

- Module: written study beside `docs/plan/modules/04-deterministic-verification.md` and `docs/plan/features/F30-experimental-benchmark.md`. No product module.
- Phase: 1, as a written study beside the benchmark, not as a billing product
- Objective: Determine who would pay for the solution and why.

## Plan

The study is a document written in the same phase as the first benchmark. It is not a billing product. No payment integration is in scope: no checkout, no invoices, no seats, and no price charged to a customer.

The buyer hypothesis is a team that already uses coding agents and needs a gate before commit. The job in that hypothesis is to catch defects the agent's own tests pass, before the change lands. The study states that hypothesis, the user who feels the pain, and what evidence would change the hypothesis.

The study is valid only if F30 shows extra defects caught at a recorded cost. Until that table exists, the document may hold the hypothesis and the questions, and it is marked invalid as a commercial result. A recorded cost is the cost column on the benchmark, including an explicit gap if price was not measured. A gap means the study stays invalid, because "extra defects at a recorded cost" is the bar.

Interviews or notes may sit in the study. They do not replace the benchmark table. Willingness mentioned in a conversation is not validation.

## Acceptance criteria

- The study names the buyer hypothesis in one place: a team that already uses coding agents and needs a gate before commit.
- The study has no payment integration and no instruction to charge a customer.
- The validity line is one of: valid, with the F30 catch list and the recorded cost cited, or invalid, with the missing catch list or the missing cost named.
- A note that someone might pay, without that citation, is not marked valid.
- The document says why the hypothesized buyer would pay: the gate catches defects their current tests miss, at the cost the benchmark recorded.

## Evidence

- The written hypothesis and the disconfirming evidence the author would accept.
- The F30 report id, the extra-defect count, and the cost figure, or the statement that one of those is missing.
- A validity stamp that matches those citations.

## Depends on

- F30 for the extra defects and the recorded cost.
- The Phase 1 product shape already chosen: a verifier that runs before commit.
- No dependency on a ledger beyond what F30 recorded. A fuller price model may enrich a later revision of the study. It is not required to mark the first result valid or invalid.

## Does not include

- Payment integration, subscriptions, or a pricing page.
- Treating the study as valid before F30 shows extra defects at a recorded cost.
- A claim about a market size.
- Building the gate. The study reads the benchmark. It does not implement checks.

## Related

- `docs/plan/features/F30-experimental-benchmark.md`
- `docs/plan/modules/04-deterministic-verification.md`
- F30, F33, F32
- UC-61, UC-63
