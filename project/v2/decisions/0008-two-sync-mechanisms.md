---
title: Two replication mechanisms — multi-master for desktop, outbox for PWA
type: decision
status: current
deployable: [hub, desktop, pwa]
domain: []
concern: [sync, networking]
created: 2026-08-21
updated: 2026-08-21
decision_date: 2026-08-21
code_refs: []
---

# ADR-0008: Two replication mechanisms — multi-master for desktop, outbox for PWA

## Status

`current`

## Context

[[0004-three-deployables-multi-master]] establishes that desktops need multi-master
merge. The PWA also works offline, so the obvious instinct is to reuse one
mechanism for both clients.

The two clients have genuinely different requirements:

| | Desktop | PWA |
|---|---|---|
| Offline duration | long, frequent | short, per-session |
| Users per instance | shared workstation | one person, one device |
| Access pattern | reads and edits the whole dataset | reads a slice, submits work |
| Concurrent same-record editing | routine | rare, and the record is usually one the user just created |
| Editing existing records offline | yes | mostly not |

A submission-oriented client with one user and short sessions does not need merge
semantics. It needs a durable queue.

Part of why the current sync layer is 42,708 LOC is that a single mechanism was
stretched to serve both profiles.

## Decision

Two mechanisms, each sized to its actual requirement:

- **Desktop ↔ hub:** full multi-master replication over the op-log, per
  [[0007-sync-built-in-house]].
- **PWA ↔ hub:** a local **outbox**. Offline actions queue and replay in order when
  connectivity returns. Reads come from a cached slice. No merge engine on the
  client.

They share the op-log format and wire contracts. They do not share the merge engine,
because the PWA does not have one.

## Alternatives considered

| Option | Why not |
|---|---|
| **One mechanism for both clients** | The PWA pays the entire complexity cost of multi-master for a scenario it does not have. This is close to what exists today, and part of why the current layer is as large as it is. |
| **PWA fully stateless, online-only** | Field staff genuinely lose connectivity mid-task; losing a partially entered work request is a real failure. |
| **PWA gets a full local replica** | Large data transfer to a phone, plus a merge engine in the browser, to support editing that essentially does not happen offline. |

## Consequences

**Accepted costs.**

- Two client paths to build, test, and reason about instead of one.
- Some duplicated concepts across the two — the op-log format is shared, but queuing,
  retry, and conflict handling differ.
- A PWA edit to a record that changed on the hub meanwhile must be handled
  explicitly: the outbox replay can fail, and the user must be told. There is no
  merge engine to absorb it silently, which is the intended behaviour.

**Follow-on work.**

- Define outbox replay-failure semantics and the user-facing surface for it.
- Decide whether the PWA outbox and the desktop op-log share a serialisation format.
  Preference: yes, so hub ingestion has one path.

## Revisit if

PWA users start routinely editing existing records offline. That would move the PWA
into the desktop's requirement profile and justify one shared mechanism.
