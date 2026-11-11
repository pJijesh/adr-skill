# When to write an ADR

Write one when any of these is true:

- The decision is hard or expensive to reverse (a database, a cloud provider, an identity model, a public API shape).
- It affects more than one team or more than one system.
- It changes cost, security posture, availability or a compliance obligation.
- People disagreed, and the disagreement was settled by reasoning that will be forgotten.
- A new joiner would reasonably ask "why did we do it this way?" in a year.

Do not write one for:

- A choice that is trivial to change next week.
- A design walkthrough. Put that in a design document and link to it.
- A bug fix, unless the fix changes how the system is meant to work.
- A decision nobody has actually made yet. Record it as `proposed` or wait.

If unsure, ask: "Would reverting this next quarter cost more than an afternoon?" If yes, write it.
