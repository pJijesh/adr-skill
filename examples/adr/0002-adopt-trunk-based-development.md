# 0002. Adopt trunk-based development

- Status: accepted
- Date: 2026-01-26
- Deciders: Platform team

## Context

Long-lived feature branches caused two painful merges in December and delayed a release by four days. The team is small, deploys several times a week, and already runs automated tests on every push.

## Options considered

### Option A: Keep long-lived feature branches

Familiar to everyone. Branches drift, merges are large, and reviews arrive late.

### Option B: Trunk-based development with short-lived branches and feature flags

Branches live for a day or two and merge to main behind flags when the work is incomplete. It needs discipline about flags and a fast test run.

## Decision

We will use trunk-based development (Option B): branches last no more than two working days, and unfinished work ships behind a flag.

## Consequences

### Good

- Smaller reviews and fewer merge conflicts.
- Releases stop depending on a single large merge.

### Bad

- Flags add code that must be removed later; stale flags become clutter.
- The test run must stay under ten minutes or the habit will not hold.

## Review

Revisit after the first quarter, or sooner if the test run exceeds ten minutes.
