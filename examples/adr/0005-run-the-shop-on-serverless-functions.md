# 0005. Run the shop on serverless functions

- Status: accepted
- Date: 2026-05-18
- Deciders: Platform team
- Supersedes: 0003

## Context

Monthly hosting cost passed the agreed limit under decision 0003 because the container service bills for idle capacity overnight and at weekends, when traffic is under five per cent of the daily peak. The shop has no long-running processes apart from the worker, which can be driven by a queue.

## Options considered

### Option A: Stay on the managed container service and shrink the instances

No migration work. The saving is small because the minimum size still bills all day.

### Option B: Serverless functions behind an API gateway, with a queue for the worker

Billing follows usage. Cold starts add latency to the first request after a quiet period, and local development needs an emulator.

## Decision

We will move the shop to serverless functions behind an API gateway (Option B) and replace the worker with a queue consumer.

## Consequences

### Good

- Hosting cost follows traffic, with an expected saving of about half.
- No instances to size or patch.

### Bad

- Cold starts will add noticeable latency after quiet periods; we will keep a small warm pool for checkout.
- The team must learn a new local development workflow.

## Review

Revisit after three months against the cost target and the checkout latency target.
