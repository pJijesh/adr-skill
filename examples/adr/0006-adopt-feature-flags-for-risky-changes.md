# 0006. Adopt feature flags for risky changes

- Status: proposed
- Date: 2026-11-02
- Deciders: Platform team

## Context

Trunk-based development under decision 0002 means unfinished work ships behind flags, but today each flag is an ad hoc configuration value. Nobody can list the flags in use, and two stale flags were found in the last release.

## Options considered

### Option A: Keep flags as plain configuration values

No new tooling. The flag list remains unknown and clean-up depends on memory.

### Option B: Adopt a small flag library with an owner and an expiry date on every flag

Flags are listed in one place and expire with a warning. Adds a dependency and a short process.

## Decision

We will adopt a small flag library (Option B) where every flag records an owner and an expiry date.

## Consequences

### Good

- One list of live flags, and stale flags are reported automatically.

### Bad

- One more dependency to keep patched.
- Engineers must set an owner and expiry on every flag, which adds a little friction.

## Review

Revisit once the first ten flags have expired, to check that clean-up actually happened.
