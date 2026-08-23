---
title: Decision Log
type: decision
status: current
deployable: []
domain: []
concern: [documentation]
created: 2026-08-21
updated: 2026-08-21
code_refs: []
---

# Decision Log

Architecture decision records for the rebuild. Each records a choice, the evidence
behind it, the alternatives rejected, and the fact that would make it wrong.

**An accepted ADR is not edited.** When a decision changes, write a new one, set
`superseded_by` on the old, and leave the original readable. The value of this log
is that it shows what was believed at the time.

## Index

| # | Decision | Concerns |
|---|---|---|
| [[0001-rebuild-on-clean-core\|0001]] | Rebuild on a clean core rather than refactor in place | build |
| [[0002-documentation-taxonomy-in-metadata\|0002]] | Documentation taxonomy lives in metadata, not folder paths | documentation |
| [[0003-conventions-require-enforcement\|0003]] | Every convention must have a machine enforcer | build, testing |
| [[0004-three-deployables-multi-master\|0004]] | Retain three deployables; desktop requires multi-master replication | sync, networking, storage |
| [[0005-monorepo-generated-contracts\|0005]] | Single workspace with wire contracts generated from the backend | build, data-integrity |
| [[0006-pwa-direct-writes-are-proposals\|0006]] | PWA direct write paths are append-only proposals | sync, integration |
| [[0007-sync-built-in-house\|0007]] | Build the replication engine in-house | sync, data-integrity |
| [[0008-two-sync-mechanisms\|0008]] | Two replication mechanisms — multi-master desktop, outbox PWA | sync, networking |
| [[0009-hybrid-logical-clocks\|0009]] | Order replicated changes with hybrid logical clocks | sync, data-integrity |
| [[0010-keep-jvm-backend-angular-clients\|0010]] | Keep the JVM for the backend; Angular and Electron for the clients | build, integration, storage |
| [[0011-entity-modelling-for-replication\|0011]] | Entity modelling rules for replication | sync, data-integrity, storage |

All are `current`. None superseded.

**What an ADR is:** a record of one architectural decision — the situation that forced
it, what was chosen, what was rejected and why, and what it costs. Numbered and dated
so they read as a chronological log. Never edited once accepted: when a decision
changes, a new ADR supersedes the old one and the original stays readable, because its
value is showing what was believed at the time and on what evidence. The rejected
options matter most — they stop a settled question being reopened without new facts.

## How these were reached

0001–0003 came from examining the existing system: its size, its test coverage, its
missing migration tooling, and the specific ways its conventions drifted. The
measurements are quoted in each record rather than summarised, so they can be
checked.

0004 is the pivot the rest depends on. Simpler architectures — thin desktop clients,
or a single authoritative hub with client outboxes — were considered seriously and
would have removed most of the system's complexity. They were rejected on two
operational facts: desktops run partitioned frequently and for long periods, and two
desktops routinely edit the same fields of the same record while disconnected. The
second fact is what makes multi-master unavoidable.

0005–0009 follow from 0004 plus the measured failure modes of the current
implementation.

0010 asked whether the platform itself was wrong — whether an all-TypeScript stack
would serve better than Java plus Angular. It concluded the platform was already
right. That is worth stating plainly, because it narrows what the rebuild is *for*:

> **The platform choices were sound. The engineering practices around them were not.**

Spring Boot, Angular, Electron, and a statically-hosted PWA all survived examination.
What did not survive: Hibernate auto-DDL with no migrations, wall-clock ordering,
hand-written wire types, no workspace or shared packages, no enforced conventions, no
test policy, and an entity model reshaped until its own replication layer needed
42,708 lines. None of those are tool choices. They are discipline and modelling.

The rebuild is therefore not a re-platforming. It is the same platform, used properly,
on a data model designed once with the requirements known.

## Still open

See [[../architecture/open-questions]]. The database choice and the module layout are
both blocked on measuring how much of replication is inherent complexity — which is
the next piece of work.
