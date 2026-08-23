---
title: Open Questions
type: architecture
status: current
deployable: []
domain: []
concern: [sync, storage, build, auth]
created: 2026-08-21
updated: 2026-08-21
code_refs: []
---

# Open Questions

Everything not yet decided, with what each one blocks and what would settle it.
When one is resolved it becomes an ADR and is removed from here.

## Blocking

### Q1 — Database, per deployable

**Blocks:** entity model, migration tooling, the whole domain sequence.
**No longer blocked by Q2** — see below.

The hub and the desktop have different constraints and may not want the same engine.
The desktop must run embedded with no administrator involvement; the hub does not.
Current system uses H2 file databases for both, with a 1.4 GB production file and no
compaction.

The replication spike found that the merge engine imposes almost nothing on storage:
append-only insert, read forward from a cursor, and one transaction spanning the data
write and the op-log write. No extensions, triggers, or special types. See
[[replication-spike-findings]].

So this is now decidable on its own merits — embedded requirement, migration tooling,
operational size, backup and restore — rather than waiting on replication.

**This is the next decision.**

### Q2 — How much of replication is inherent — **ANSWERED 2026-08-21**

Measured by building it. Full write-up: [[replication-spike-findings]].

- Merge core: **404 lines** new, against **4,849** in the current system — the
  hypothesis holds where it matters.
- But ADR-0007's "roughly a tenth of 42,708" target is **too aggressive**. Around
  8,000 of the current lines are SharePoint bridging, file-content sync, and
  transport, none of which shrink because the merge engine got smaller.
- Revised realistic target: **8,000–12,000 lines total, merge core under 1,000.**

Not yet proven: persistence, entity create/delete, and foreign-key ordering — the
last being the most likely place the count grows, since it is what produced the
current three-pass applier.

### Q3 — Module and package layout

**Blocks:** [[../conventions/naming]], [[../conventions/filesystem]], and therefore
the ArchUnit rules.

Decided so far: one workspace with shared frontend packages
([[../decisions/0005-monorepo-generated-contracts]]). Undecided: how the backend
divides — by domain, by layer, or by deployable — and whether hub and desktop are
one artifact with profiles, as today, or two.

Settled by: sketching two candidate layouts against three real domains and seeing
which produces fewer cross-module dependencies.

## Important, not yet blocking

### Q4 — Conflict resolution surface

Same-field concurrent edits are routine and must reach a human
([[../decisions/0004-three-deployables-multi-master]]). Undecided: who resolves,
where, how they are notified, and what happens to the record while it is unresolved.

This is a product question, not only a technical one, and it needs answering before
the first domain ships.

### Q5 — Identity assignment

The hub assigns identity for PWA proposals
([[../decisions/0006-pwa-direct-writes-are-proposals]]). Desktops create records
offline and must also assign identity locally, without collision. Undecided: scheme
(UUIDv7, node-prefixed, other), and whether desktops and proposals share it.

Note: the current `DevicePrefixedIdGenerator` solves this, and the reason it exists
should be understood before replacing it.

### Q6 — Migration and cutover, per domain

Each domain moves with live data ([[../decisions/0001-rebuild-on-clean-core]]).
Undecided: whether both systems serve a domain simultaneously during cutover, or
whether it is a scheduled switch with rollback. Affects whether the old and new
systems must replicate to each other, which would be a significant extra build.

### Q7 — Authentication model

Current system has hub-issued JWTs plus Supabase as a second issuer. Undecided:
whether the rebuild keeps dual issuers, and how desktops authenticate while
partitioned — a desktop that cannot reach the hub cannot validate a token freshly.

Offline authentication is a real design problem and is easy to get wrong.

## Answered, recorded elsewhere

| Question | Answer |
|---|---|
| Rebuild or refactor? | [[../decisions/0001-rebuild-on-clean-core]] |
| How is documentation organised? | [[../decisions/0002-documentation-taxonomy-in-metadata]] |
| How are conventions kept? | [[../decisions/0003-conventions-require-enforcement]] |
| Keep three deployables? | [[../decisions/0004-three-deployables-multi-master]] |
| Shared frontend code? | [[../decisions/0005-monorepo-generated-contracts]] |
| Keep PWA direct write paths? | [[../decisions/0006-pwa-direct-writes-are-proposals]] |
| Buy or build replication? | [[../decisions/0007-sync-built-in-house]] |
| One sync mechanism or two? | [[../decisions/0008-two-sync-mechanisms]] |
| How are changes ordered? | [[../decisions/0009-hybrid-logical-clocks]] |
| What stack? | [[../decisions/0010-keep-jvm-backend-angular-clients]] |
| How much of replication is inherent? | [[../guides/replication-spike-findings]] |
