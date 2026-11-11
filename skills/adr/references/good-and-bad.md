# Good and bad

## Decisions

| Weak | Better |
| --- | --- |
| "We chose Postgres because it is best." | "We will use PostgreSQL on a managed service (Option A) for the catalogue and orders." |
| "Options: use the database." | Two or more named alternatives with honest pros and cons each. |
| "Consequences: none." | "Bad: search relevance will be weaker than a dedicated engine; we accept that for the first release." |
| "Review: later." | "Revisit when search complaints exceed five a week or the catalogue passes 500,000 titles." |

## Context

Weak: "The current system is outdated and everyone hates it."
Better: "Deployments are manual and the single virtual machine is a recovery risk. A rebuild takes about a day."

The weak version is an opinion. The better one gives the reader something to check.

## Options

Weak: a rejected option described as obviously bad ("naive", "legacy"). That tells the reader the writer did not take it seriously, and the decision looks predetermined.

Better: say what is genuinely good about the option and why it still lost: "Cheapest and well understood. Recovery still means rebuilding a machine."

## Smells

- Only one real option, plus a straw man.
- The Decision restates the Context.
- Consequences are all good.
- Nothing says when to revisit.
- Names, numbers or dates that nobody can source.
