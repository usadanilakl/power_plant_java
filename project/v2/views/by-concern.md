---
title: By Concern
type: reference
status: current
deployable: []
domain: []
concern: [documentation]
created: 2026-08-21
updated: 2026-08-21
code_refs: []
---

# By Concern

Cross-cutting technical subjects — the axis that had no home in the old folder
layout. A document appears under every concern it carries.

```dataview
TABLE rows.file.link AS "Documents"
FROM -"_meta/templates" AND -"views"
FLATTEN concern AS Concern
GROUP BY Concern
SORT Concern ASC
```

## The sync cluster

The concern with the most weight, and the one the rebuild turns on.

```dataview
TABLE WITHOUT ID
  file.link AS "Document",
  type AS "Type",
  status AS "Status"
FROM -"_meta/templates" AND -"views"
WHERE contains(concern, "sync") OR contains(concern, "data-integrity")
SORT file.name ASC
```

---

[[index|← Home]] · [[by-deployable]] · [[frontmatter-schema|Vocabulary]]
