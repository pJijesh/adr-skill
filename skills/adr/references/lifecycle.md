# Lifecycle

| Status | Meaning |
| --- | --- |
| proposed | Written and open for discussion. It should not stay here for long; the linter warns after 60 days by default. |
| accepted | The deciders agreed. The decision is in force. |
| rejected | The deciders considered it and said no. Keep the record; it stops the idea being re-proposed without new facts. |
| deprecated | No longer in force, and nothing replaces it. |
| superseded | Replaced by a later ADR. Must link to it. |

## What may change after acceptance

Only the status, the date of a status change if you choose to update it, and the links. The context, options, decision and consequences of an accepted ADR are history and are not edited. If you find a factual mistake, add a short "Correction" note at the end rather than rewriting.

## Superseding

Do not edit the old decision's reasoning. Run:

```text
node adr.mjs supersede <dir> <number> "New title"
```

This creates the new ADR with `- Supersedes: <old>` and updates the old one to `- Status: superseded` and `- Superseded by: <new>`. The linter checks that both sides agree. In the new ADR, say in Context what changed since the old decision.

## Rejected and deprecated

Use `adr.mjs status <dir> <number> rejected` or `deprecated`. A deprecated decision should say in its Review section why it no longer applies.
