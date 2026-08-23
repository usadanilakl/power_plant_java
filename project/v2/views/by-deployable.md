---
title: By Deployable
type: reference
status: current
deployable: []
domain: []
concern: [documentation]
created: 2026-08-21
updated: 2026-08-21
code_refs: []
---

# By Deployable

Documents that say something **specific** to one running system.

A document that applies equally to all of them carries `deployable: []` and is listed
under "Applies everywhere" below — not repeated under each. A list naming every value
would carry no information and is banned by the schema.

```dataview
TABLE rows.file.link AS "Documents"
FROM -"_meta/templates" AND -"views"
FLATTEN deployable AS Deployable
GROUP BY Deployable
SORT Deployable ASC
```

## Applies everywhere

Foundational and cross-cutting documents. **Read these regardless of which
deployable you are working on.**

```dataview
TABLE WITHOUT ID
  file.link AS "Document",
  type AS "Type"
FROM -"_meta/templates" AND -"views"
WHERE length(deployable) = 0
SORT type ASC, file.name ASC
```

---

[[index|← Home]] · [[by-concern]] · [[frontmatter-schema|Vocabulary]]
