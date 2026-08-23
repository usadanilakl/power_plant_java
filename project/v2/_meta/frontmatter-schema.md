---
title: Frontmatter Schema
type: reference
status: current
deployable: []
domain: []
concern: [documentation]
created: 2026-08-21
updated: 2026-08-21
---

# Frontmatter Schema

Every document in `project/v2/` carries this block. It is the contract that makes
[[README|placement-independent grouping]] work — the generated views read these
fields, so an omitted field means the document disappears from a view.

**Write every field. Use `[]` for "none", never omit the key.**

> **A list naming every value in its vocabulary must be written `[]`.**
>
> `deployable: [hub, desktop, pwa, electron-shell, shared]` filters nothing — the
> document appears under every group and separates nothing from anything. It is the
> same statement as "applies everywhere", which is what `[]` means, and the views
> list those separately.
>
> This rule was added on 2026-08-21 after 13 of 28 documents were tagged with every
> deployable, which made the by-deployable view unreadable. Machine-checkable, and
> enforced.

## Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `title` | string | yes | Human title. Does not need to match the filename |
| `type` | enum | yes | `decision` \| `convention` \| `guide` \| `reference` \| `architecture` — must match the folder |
| `status` | enum | yes | `draft` \| `current` \| `superseded` \| `deprecated` |
| `deployable` | list | yes | See vocabulary below. `[]` if it applies to none specifically |
| `domain` | list | yes | See vocabulary below. `[]` for cross-cutting docs |
| `concern` | list | yes | See vocabulary below. `[]` is rare — most docs have at least one |
| `created` | date | yes | ISO `YYYY-MM-DD`. Never changes |
| `updated` | date | yes | ISO `YYYY-MM-DD`. Bump on every substantive edit |
| `code_refs` | list | no | Repo-relative paths this doc references. **CI validates these exist** |
| `supersedes` | list | no | Slugs of documents this replaces |
| `superseded_by` | string | no | Set when `status: superseded` |
| `decision_date` | date | decisions only | When the decision was accepted |

## Controlled vocabularies

Adding a value is a deliberate act — it creates a new column in every generated
view. Add it here first, then use it.

### `deployable`

| Value | Meaning |
|---|---|
| `hub` | Central server: auth, sync authority, scheduled tasks, SharePoint/Supabase integration |
| `desktop` | Electron-wrapped local instance with its own database |
| `pwa` | Mobile web app, offline-capable |
| `electron-shell` | The Electron process itself — windows, updates, managed sub-apps |
| `shared` | Code or rules used by more than one of the above |

### `domain`

Business areas. `[]` when the document is not about a business area.

`loto` · `permits` · `maximo` · `rounds` · `schedule` · `files` · `users` ·
`instrumentation` · `sds` · `ordering` · `equipment` · `messaging`

### `concern`

Cross-cutting technical concerns. This is the axis that had **no home** in the old
folder layout, and the main reason this schema exists.

`sync` · `auth` · `storage` · `backup` · `networking` · `integration` ·
`observability` · `build` · `testing` · `documentation` · `data-integrity` ·
`performance` · `security`

## Example

```yaml
---
title: Field change emission
type: guide
status: current
deployable: [hub, desktop]
domain: []
concern: [sync, data-integrity]
created: 2026-08-21
updated: 2026-08-21
code_refs:
  - src/main/java/com/dk_power/power_plant_java/entities/sync/FieldChange.java
---
```

This document appears under **hub** and **desktop**, under **sync** and
**data-integrity**, and under no domain — because it is infrastructure, not a
feature. In the old layout it had to be filed in one place and cross-referenced
from two others, or duplicated. Here it is filed once.

## Enforcement

A CI check validates, for every file under `project/v2/`:

1. Frontmatter parses as YAML and all required fields are present
2. Every enum value is in the vocabulary above
3. `type` matches the containing folder
4. Every `code_refs` path exists in the repo
5. Every wiki-style link resolves to a document that exists
6. `superseded_by` is set whenever `status: superseded`

### Requirements on the link checker

Found by running these rules by hand against this folder on 2026-08-21. A naive
implementation produces false positives on all three:

- **Skip fenced blocks and inline code spans.** Documentation about the link syntax
  necessarily contains link syntax as an example. Those are prose, not links.
- **Handle pipe-escaped aliases.** Inside a markdown table an alias pipe must be
  written `\|` or the table breaks, so the alias-stripping must accept both forms.
- **Skip `_meta/templates/`.** Templates contain deliberate placeholders
  (`ADR-NNNN`, `other-doc`) that will never resolve.

The `code_refs` rule has no exemptions. An example in documentation is still a
reference, and if it names a path that does not exist it is wrong — this rule caught
exactly that mistake in this file.

An unenforced convention is a wish — see [[../conventions/README|Conventions]].
