---
title: Documentation taxonomy lives in metadata, not folder paths
type: decision
status: current
deployable: []
domain: []
concern: [documentation]
created: 2026-08-21
updated: 2026-08-21
decision_date: 2026-08-21
code_refs: []
---

# ADR-0002: Documentation taxonomy lives in metadata, not folder paths

## Status

`current`

## Context

The existing documentation is 384 markdown files — roughly 38,000 lines under
`project/` plus 177 more scattered elsewhere — with no tooling, no index, no
frontmatter on any file, and one `.rtf` in the middle of it. Nothing verifies any
of it, so no reader can tell which files are still true.

Two organisations were attempted, and both failed for the same structural reason:

- **By deployable** (`springboot/`, `electron/`, `pwa/`) — one feature ends up
  documented in three places.
- **By feature**, subdivided by deployable — cross-cutting subjects such as sync,
  auth, and backup have no home at all.

The content genuinely has three orthogonal axes — deployable, domain, and concern —
and a document may hold several values on each. A single folder hierarchy can
express exactly one axis.

## Decision

Folders encode only **document type**, which is the one attribute a document can
have exactly one of. Deployable, domain, and concern are multi-valued frontmatter
fields, and every grouped view is generated from them.

Author and browse in **Obsidian** over the plain folder. Publish a static site later
from the same files.

## Alternatives considered

| Option | Why not |
|---|---|
| **Pick one axis and accept the awkwardness** | Already tried twice. Produces either triplication or homeless documents. |
| **Duplicate documents across axes** | Guarantees divergence — duplicates are never updated together. |
| **A database-backed docs application** | Removes documentation from git, from diffs, and from review. Content becomes hostage to the tool. |
| **Hand-built HTML shell** | Rebuilds search, navigation, and cross-referencing badly, and becomes a maintenance project of its own. |

The **format** — markdown with YAML frontmatter, in git — is the decision that
matters and is meant to be permanent. The **viewer** is deliberately replaceable.

## Consequences

**Accepted costs.**

- Every document must carry complete frontmatter. A missing field silently drops the
  document from a generated view, so this needs CI enforcement rather than
  discipline.
- Controlled vocabularies must be curated; a typo creates a phantom category.
- Obsidian is a single-user tool. A published site is a separate, later step.

**Follow-on work.**

- Frontmatter validator in CI, per [[frontmatter-schema]].
- Link-checker validating `code_refs` paths and `[[wikilinks]]`.
- Generated view pages, one per axis.

## Revisit if

The document count stays small enough that a single tree is not painful. Under
roughly 30 documents this machinery costs more than it saves.
