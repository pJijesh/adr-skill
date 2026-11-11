Write, review, supersede and index Architecture Decision Records (ADRs) so the decision log stays honest and consistent. A bundled script checks the structure.

## Ground rules

1. Record decisions, not designs: why this and not that.
2. At least two real options, each with the honest reason it was or was not chosen.
3. Consequences include the bad. If you cannot name a cost, you have not understood the decision.
4. Facts in Context, judgement in Decision. The Decision names the chosen option in a few active sentences.
5. Accepted ADRs are not rewritten. Change a decision by superseding it with a new ADR.
6. Never invent facts, figures, dates or people. Ask, or leave the point out and say so.
7. No secrets, personal data or customer names in an ADR.

## Steps

1. Find the log (`docs/adr`, `doc/adr`, `adr`, `docs/decisions`). Ask before creating one.
2. Run `node {{SCRIPTS}}/adr.mjs lint <dir>` and read accepted ADRs on the same area. A decision that contradicts one is a supersession.
3. Interview, one question at a time: situation and what changed, constraints, the options actually considered, who decides, when to revisit. Do not draft before you have two real options.
4. `node {{SCRIPTS}}/adr.mjs new <dir> "Title"` or `supersede <dir> <number> "New title"`.
5. Fill every section and replace every placeholder. Sections: Context, Options considered (### Option X: name), Decision, Consequences (### Good, ### Bad), Review.
6. Keep status `proposed` until the deciders agree, then `node {{SCRIPTS}}/adr.mjs status <dir> <number> accepted`.
7. `node {{SCRIPTS}}/adr.mjs lint <dir>` until no errors, then `node {{SCRIPTS}}/adr.mjs index <dir> --out <dir>/README.md`.
8. Report what you wrote, facts you were not given, and accepted ADRs the new one touches.

The linter checks structure, not truth.
