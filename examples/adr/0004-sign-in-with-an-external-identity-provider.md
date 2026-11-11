# 0004. Sign in with an external identity provider

- Status: accepted
- Date: 2026-02-23
- Deciders: Platform team, Support lead

## Context

Customers currently create a password on our site. Password resets are the largest source of support tickets, and storing credentials is a risk the team would rather not carry. Customers already have accounts with common identity providers.

## Options considered

### Option A: Keep our own passwords and add multi-factor sign-in

Full control of the experience. We keep the credential risk and the reset tickets.

### Option B: Sign in through an external identity provider using OpenID Connect

We store no passwords. Customers without an account at a supported provider need another route.

### Option C: Email one-time links only

No passwords and no provider dependency. Sign-in depends on email delivery speed.

## Decision

We will use an external identity provider with OpenID Connect (Option B), and offer email one-time links as the fallback for customers without a supported account.

## Consequences

### Good

- No stored passwords, and far fewer reset tickets.
- Multi-factor sign-in comes from the provider.

### Bad

- A provider outage stops sign-in until the email fallback is used.
- Account linking needs care when a customer has used both routes.

## Review

Revisit after six months using the sign-in failure rate and the number of support tickets about access.
