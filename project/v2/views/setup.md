---
title: Viewer Setup
type: reference
status: current
deployable: []
domain: []
concern: [documentation]
created: 2026-08-21
updated: 2026-08-21
code_refs: []
---

# Viewer Setup

What to install to read this documentation with working navigation.

## 1. Obsidian

Free for personal use. Download the Windows installer from **obsidian.md**.

Obsidian reads a plain folder of markdown files. It does not import, convert, or
take ownership of anything — the files stay exactly as they are in git, and
uninstalling it leaves the documentation untouched. That property is why it was
chosen; see [[0002-documentation-taxonomy-in-metadata]].

## 2. Open this folder as a vault

**Open folder as vault** → select:

```
c:\Users\usada\my_projects\power_plant_java\project\v2
```

Point it at `project/v2`, not the repository root. The vault is the documentation,
not the code.

## 3. Install Dataview

The grouped views on [[index]], [[by-concern]], [[by-deployable]], and [[by-domain]]
are queries, not lists. Without a query engine they render as code blocks.

**Settings → Community plugins → Browse → "Dataview" → Install → Enable.**

Obsidian will ask you to turn off Restricted Mode first — that is expected, and is
what allows community plugins to run.

### Or use Bases instead

Recent Obsidian versions ship a core **Bases** feature that builds table views from
frontmatter properties without a community plugin. If your version has it, it does
the same job through a UI rather than query text. The `.md` files and their
frontmatter are identical either way — only the view pages would need rewriting.

Check **Settings → Core plugins** for "Bases". If it is not there, use Dataview.

## 4. Set the home note

**Settings → Appearance → Home note**, or simply open [[index]] and pin the tab.

## Optional, worth having

| Plugin | Why |
|---|---|
| **Templater** | Applies the templates in `_meta/templates/` with dates filled in automatically |
| **Git** | Commits the vault from inside Obsidian, so documentation edits do not require leaving the app |

Neither is required.

## What you should see once it works

- **Left sidebar** — five folders by document type: `decisions`, `conventions`,
  `guides`, `reference`, `architecture`, plus `_meta` and `views`.
- **[[index]]** — live counts by status, the draft list, and the decision log.
- **[[by-concern]]** — every document grouped under sync, security, build, testing,
  and so on, with documents appearing under several.
- **Graph view** — the decision records clustered around
  [[0004-three-deployables-multi-master]], which is the pivot most other decisions
  hang off.
- **Backlinks panel** — on any decision, everything that references it.

## If the tables are empty

Dataview queries read frontmatter. If a document is missing fields it silently drops
out of every view — which is exactly why the frontmatter rules in
[[frontmatter-schema]] are CI-enforced rather than left to discipline.

Check that **Settings → Dataview → Enable JavaScript queries** is not required (it is
not — these are plain `dataview` blocks), and that the file you expect has complete
frontmatter.

## Publishing later

None of the above is needed to read the raw files — they are plain markdown and
render on GitHub, in VS Code, or in any editor. Obsidian adds the querying and
linking.

When a browsable site is wanted, **Quartz** or **MkDocs Material** builds one from
these same files. That step changes nothing on disk. The format is the permanent
decision; the viewer is deliberately replaceable.
