---
name: adr
description: Use to write, review, supersede or index Architecture Decision Records (ADRs) in a repository. Interviews for the context and real alternatives, drafts a short decision record with honest consequences, and runs a bundled linter and index builder so the decision log stays consistent.
---

# Architecture decision records

An ADR records one significant decision, why it was made, and what it costs. Done well, it saves the next engineer from re-arguing the decision or undoing it by accident. Done badly, it is a justification written after the fact. This skill produces the first kind, and a bundled script checks the structure so the log stays trustworthy.

Read this file first. Open the references only when a step tells you to.

## Ground rules

1. Record decisions, not designs. An ADR answers "why this and not that", not "how does it work".
2. Two real options at least. A decision with one option is an announcement. List the alternatives that were actually considered and the honest reason each was not chosen.
3. Consequences include the bad. Every decision has a cost. If you cannot name one, you have not understood the decision yet.
4. Facts in Context, judgement in Decision. Do not smuggle the conclusion into the background.
5. Accepted ADRs are not rewritten. Their status and links may change; their reasoning does not. To change a decision, supersede it with a new ADR.
6. Never invent facts, figures, dates or people. If the person has not told you the context or the numbers, ask, or leave the point out and say so.
7. Do not put secrets, personal data or customer names in an ADR. It will be committed.

## When to write one

Open [references/when-to-write.md](references/when-to-write.md). In short: write an ADR when a decision is hard to reverse, affects more than one team, changes cost, security or compliance, or when someone will ask "why did we do it this way" in a year.

## Steps

1. Find the decision log. Look for `docs/adr`, `doc/adr`, `adr`, `docs/decisions` or `decisions`. If there is none, ask before creating one and suggest `docs/adr`.
2. Read what exists. Run `node {{SCRIPTS}}/adr.mjs lint <dir>` and read the accepted ADRs that touch the same area. A new decision must not silently contradict an accepted one; if it does, it is a supersession.
3. Interview. Ask, one question at a time, for: the situation and what changed; the forces and constraints; the options actually considered; who decides; and when it should be revisited. Do not draft until you have at least two real options.
4. Create the file with `node {{SCRIPTS}}/adr.mjs new <dir> "Short title in the imperative"`, or `supersede <dir> <number> "New title"` when replacing a decision. This numbers the file, fills the template and, for a supersession, updates both records.
5. Write it, following [references/writing-guide.md](references/writing-guide.md). Replace every placeholder. Keep the Decision to a few active sentences that name the chosen option.
6. Set the status honestly: `proposed` until the deciders agree, then `node {{SCRIPTS}}/adr.mjs status <dir> <number> accepted`.
7. Lint and index. Run `node {{SCRIPTS}}/adr.mjs lint <dir>` until it reports no errors, then `node {{SCRIPTS}}/adr.mjs index <dir> --out <dir>/README.md`.
8. Report what you wrote, any facts you were not given, and any accepted ADR the new one touches.

## The lifecycle

Statuses are `proposed`, `accepted`, `rejected`, `deprecated` and `superseded`. See [references/lifecycle.md](references/lifecycle.md) for what each means and how supersession is linked.

## Tools

```text
node {{SCRIPTS}}/adr.mjs new <dir> "Title"
node {{SCRIPTS}}/adr.mjs supersede <dir> <number> "New title"
node {{SCRIPTS}}/adr.mjs status <dir> <number> <proposed|accepted|rejected|deprecated>
node {{SCRIPTS}}/adr.mjs lint <dir> [--strict] [--json]
node {{SCRIPTS}}/adr.mjs index <dir> --out <dir>/README.md
node {{SCRIPTS}}/adr.mjs rules
```

The linter checks structure, not truth. It cannot tell whether the reasoning is sound; that is for the people who decide. The rule list is in [references/lint-rules.md](references/lint-rules.md), and [references/good-and-bad.md](references/good-and-bad.md) shows what separates a useful record from a weak one.
