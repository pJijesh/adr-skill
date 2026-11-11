# Writing guide

## Title

Short, imperative, specific: "Use PostgreSQL for the catalogue", not "Database" or "Discussion about databases". Under 80 characters.

## Context

Facts only: the situation, the constraints, the numbers that matter, what changed. Do not argue for the decision here. A reader who disagrees with the decision should still agree with the context.

If you do not know a number, do not make one up. Say what is unknown.

## Options considered

At least two, as `### Option A: name`, `### Option B: name`. For each, say what it is and give the honest case for and against it, including for the one you chose. The rejected options are the most valuable part of an ADR in two years' time, because they stop the argument being repeated.

Include the "do nothing" option when it is real.

## Decision

One to three active sentences: "We will ...". Name the chosen option by its label or its name. Do not restate the context. The linter flags a Decision that does not name an option, and one longer than 150 words.

## Consequences

Two subsections, both required and both with content:

- `### Good`: what gets better.
- `### Bad`: what gets worse, what we are accepting, what new work or risk it creates.

Neutral or follow-up items can sit under either, or in a third subsection.

## Review

When or on what trigger the decision should be looked at again: a date, a size, a cost or an event. "Never" is not a review trigger.

## Style

- Plain words, short sentences, British English.
- No marketing language ("best-in-class", "seamless").
- Link to evidence (a benchmark, a ticket, a design document) rather than pasting it.
- Past tense for what happened, future tense for what will change.
