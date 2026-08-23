---
title: Home
type: reference
status: current
deployable: []
domain: []
concern: [documentation]
created: 2026-08-21
updated: 2026-08-21
code_refs: []
---

# v2 Documentation — Home

Set this as the vault home note. Setup instructions: [[setup]].

> **Read this first if the views look thin.**
> There are 30 documents here, nearly all of them foundational — decisions,
> conventions, and the documentation system itself. At this size the folder tree in
> the left sidebar is genuinely the fastest way to navigate, and these query views
> have little to separate. That is expected:
> [[0002-documentation-taxonomy-in-metadata]] says outright that under roughly 30
> documents this machinery costs more than it saves. It earns its keep once domain
> documentation exists, when a single feature spans hub, desktop, and PWA and there
> is no one folder it belongs in.

## Start here

| | |
|---|---|
| [[README\|How this documentation works]] | The layout rule, the three tiers, why |
| [[decisions/README\|Decision log]] | The nine decisions, and how they were reached |
| [[open-questions]] | What is still undecided and what each blocks |
| [[overview]] | The system being built |

## The decisions

```dataview
TABLE WITHOUT ID
  file.link AS "Decision",
  join(concern, ", ") AS "Concerns"
FROM "decisions"
WHERE type = "decision" AND file.name != "README"
SORT file.name ASC
```

## Not yet decided

Documents still `draft` — their subject is blocked on something in [[open-questions]].

```dataview
TABLE WITHOUT ID
  file.link AS "Document",
  type AS "Type"
FROM -"_meta/templates" AND -"views"
WHERE status = "draft"
SORT file.name ASC
```

## Everything, by type

```dataview
TABLE rows.file.link AS "Documents"
FROM -"_meta/templates" AND -"views"
GROUP BY type
SORT type ASC
```

## The axes

| View | Useful when |
|---|---|
| [[by-concern]] | Now — sync, security, build, and testing already have real spread |
| [[by-deployable]] | Thin until domain docs exist; only 4 documents are deployable-specific so far |

By-domain is not built yet. Every document currently carries `domain: []`, because
nothing here describes a business area — that starts with the first domain migration.
