# 0003. Host the shop on a managed container service

- Status: superseded
- Date: 2026-02-09
- Deciders: Platform team
- Superseded by: 0005

## Context

The shop is a single web application and a small worker. Deployments are manual and the single virtual machine is a recovery risk. The team wants repeatable deployments and rolling updates without running Kubernetes.

## Options considered

### Option A: Keep the single virtual machine and automate it

Cheapest, and the team knows it. Recovery still means rebuilding a machine.

### Option B: A managed container service

Deploy the application and worker as containers with health checks and rolling updates. The provider runs the control plane.

## Decision

We will move the shop to a managed container service (Option B).

## Consequences

### Good

- Repeatable deployments and automatic restarts.
- No machine to patch.

### Bad

- Idle cost is higher than the single machine.
- Containers need image hygiene and a registry.

## Review

Revisit if monthly hosting cost passes the agreed limit.
