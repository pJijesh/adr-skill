# 0001. Use PostgreSQL for the catalogue

- Status: accepted
- Date: 2026-01-12
- Deciders: Platform team

## Context

Kestrel Books is a fictional online bookshop with about 40,000 titles and a few thousand orders a day. The catalogue needs transactional updates to stock, relational queries across authors, editions and series, and full-text search that is good enough for a first release. The team has two engineers and no one who wants to run a database cluster.

## Options considered

### Option A: PostgreSQL on a managed service

A relational database with built-in full-text search and JSON columns. The provider handles backups, patching and failover. Cost is predictable. Search quality is adequate but not tuned.

### Option B: A document database

Flexible schema, simple to start. Stock updates across several documents need extra care, and the reporting queries the finance team wants become awkward joins in application code.

### Option C: PostgreSQL plus a dedicated search engine

Better search relevance. It adds a second system to run and keep in sync, which the team cannot support yet.

## Decision

We will use PostgreSQL on a managed service (Option A) for the catalogue and orders, and use its built-in full-text search until measured search quality says otherwise.

## Consequences

### Good

- One system to learn, back up and secure.
- Transactional stock updates and straightforward reporting queries.

### Bad

- Search relevance will be weaker than a dedicated engine, and we accept that for the first release.
- The managed service ties us to one provider's backup and failover features.

## Review

Revisit when search complaints exceed five a week or when the catalogue passes 500,000 titles.
