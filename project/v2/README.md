---
title: Documentation System
type: reference
status: current
deployable: []
domain: []
concern: [documentation]
created: 2026-08-21
updated: 2026-08-21
---

# v2 Documentation

Documentation for the rebuilt Power Plant system. Everything about the new
architecture, its decisions, and its conventions lives here and nowhere else.

## The problem this layout solves

Documentation for this system has **three orthogonal axes**:

| Axis | Values | Cardinality |
|---|---|---|
| **Deployable** | hub, desktop, pwa, electron-shell | a doc can span several |
| **Domain** | loto, permits, maximo, rounds, schedule, … | a doc can span several |
| **Concern** | sync, auth, storage, backup, networking, … | a doc can span several |

A folder tree can only express **one** axis. Grouping by deployable puts the same
feature in three places. Grouping by feature has no home for sync or auth. Both
were tried in `project/` and both broke down.

## The rule

> **Folders encode the one thing a document can only be one of: its type.**
> **Everything else lives in frontmatter and is queried, not filed.**

```
decisions/    a choice we made, and why          (exactly one type per doc)
conventions/  a rule we follow, and its enforcer
guides/       how a thing works / how to operate it
reference/    generated or semi-generated facts
architecture/ the shape of the system
```

Domain, deployable, and concern are **multi-valued frontmatter fields**. Views by
domain, by deployable, or by concern are generated from those fields. Placement
never has to be re-litigated, and nothing is duplicated to appear in two places.

See [frontmatter schema](_meta/frontmatter-schema.md) for the contract.

## The three tiers, and why each stays true

Documentation drifts unless something stops it. Each tier has a different mechanism:

| Tier | Where | Anti-drift mechanism |
|---|---|---|
| **Decisions** | `decisions/` | Records a moment in time. Immutable once accepted — cannot drift by definition. Superseded, never edited. |
| **Reference** | `reference/` | **Generated** from OpenAPI, schema, and entity metadata. Regenerated in CI. |
| **Guides / Conventions** | `guides/`, `conventions/` | Hand-written, but **embed real code by line range** instead of pasting it. CI fails if a referenced path or anchor disappears. |

### Never paste code

Pasted snippets are wrong within a month. Reference code by path and line range so
the doc renders whatever the file actually says today:

```
--8<-- "src/main/java/.../FieldChangeEntityListener.java:120:145"
```

Every file referenced this way also goes in the `code_refs` frontmatter list, which
is what the CI link-checker validates.

## Browsing

**Start at [`views/index.md`](views/index.md).** Setup instructions — what to install
and how — are in [`views/setup.md`](views/setup.md).

| View | Shows |
|---|---|
| [`views/index.md`](views/index.md) | Home: status counts, drafts, the decision log |
| [`views/by-concern.md`](views/by-concern.md) | Grouped by sync, auth, security, build, testing … |
| [`views/by-deployable.md`](views/by-deployable.md) | Grouped by hub, desktop, pwa, electron-shell |
| [`views/by-domain.md`](views/by-domain.md) | Grouped by business area |

Author and browse with **Obsidian**, pointed at this folder as a vault. It reads
plain markdown from disk with no lock-in, wiki-style links give cross-references
without duplication, and the view pages above are live queries over frontmatter
rather than hand-maintained indexes.

The files are ordinary markdown and read fine without any of this — Obsidian adds
the querying and the backlinks, not the content.

A published static site (Quartz or MkDocs Material over the same files) comes later.
The **format** — markdown with YAML frontmatter, in git — is the permanent decision.
The **viewer** is reversible and therefore low-stakes.

## Writing a new document

1. Copy the matching template from [`_meta/templates/`](_meta/templates/).
2. Fill in frontmatter completely. An empty axis is written `[]`, never omitted.
3. Put it in the folder matching its **type**. Do not create sub-folders by domain
   or deployable — that is what the frontmatter is for.
4. Link related documents with `[[wikilinks]]`. Do not restate their content.

## Status

This documentation describes a system **being designed**, not one that exists.
Anything not yet decided is tracked in [`architecture/open-questions.md`](architecture/open-questions.md).
