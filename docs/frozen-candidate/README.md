# Frozen candidate review

A script in this repo freezes the code under review and writes a result the model cannot edit. The idea comes from Receipt-Driven Development in [Gentleman-Programming/gentle-ai](https://github.com/Gentleman-Programming/gentle-ai) 4.2.0. This repo does not install Gentle AI, does not follow ODD, and does not use SDD.

The four review lenses (risk, resilience, readability, reliability) stay out. Readability is a judgment, and a second model with the same prompt is not a second mechanism.

## Decision

Implement the three rules below with a script. The script binds a finished change to the approved contract and writes a result the model cannot edit.

The approved contract stays the oracle (Module A, box 2). The script freezes the other half: the code under review.

## The three rules

1. **Freeze the candidate.** The script records the commit hash and the diff it will judge. A later edit is a new candidate. The report cites that hash (F19). This sits next to "diff and version log" on box 3.
2. **A rule picks the depth.** A passive or low-risk change gets a structural check and no reviewer. A high-risk change, or a slice that reached its budget, gets the full check. A failed assessment is not low risk. A critical failure blocks at any score. UNKNOWN is not a pass. This is box 7 (F17, F18).
3. **Re-measure the correction.** Only a severe finding caused by that candidate can block. There is one bounded correction. The script checks the same frozen trees again. If it cannot see the diff, the attempt does not count and there is no approval. The approval does not commit, push, or merge. The contract and CI still decide delivery (F29, F32).

## Out

- ODD as the outer workflow. It treats the natural-language request as the assignment. This platform freezes a YAML contract first.
- SDD phases and `/sdd-*`. They are not in Gentle AI 4.2.0.
- The skill registry, the Gentleman persona, and Engram.
- RDD's model lenses in phase 1.
