# Printable Permit Forms — Paper Sources

Reference material for the printable forms rendered by `PrintableForm` / `FormContainer`.

**Why this folder exists:** before it, the seeded form layouts existed only as Java code in
`config/PermitFormSeeder.java` and as rows in `db/proddb`. The paper forms they were transcribed
from were not stored anywhere. Drop the source documents here so a layout can always be re-derived.

## Where each form actually lives

| Form type (`form_type`) | Seeder | Layout source of truth |
|---|---|---|
| `EnergizedWorkPermit` | yes | `PermitFormSeeder.seedEnergizedWorkForm()` |
| `VentingPermit` | yes | `PermitFormSeeder.seedVentingForm()` |
| `ExcavationPermit` | yes | `PermitFormSeeder.seedExcavationForm()` |
| `Loto` | yes | `PermitFormSeeder.seedLotoForm()` |
| `SafeWork` | **no** | `db/proddb` rows only |
| `HotWork` | **no** | `db/proddb` rows only |
| `ConfinedSpace` | **no** | `db/proddb` rows only |
| `Jha` | **no** | `db/proddb` rows only |
| `JobStep` | **no** | `db/proddb` rows only |

## Folder convention

One folder per form type. Inside it:

```
<form-type>/
  current/          the paper form in use TODAY — PDF or page scans (page-1.png, page-2.png, ...)
  superseded/       older revisions, so a layout change can be diffed against what it replaced
  notes.md          binding decisions + revision history (template below)
```

Name pages `page-1`, `page-2`, … in print order. If the form is a fillable PDF, commit the PDF
itself, not a flattened scan — the embedded field names map straight to bindings.

## notes.md template

```markdown
# <Form name>

- **form_type:** <ExcavationPermit>
- **Revision:** <rev / date printed on the paper form>
- **Page size:** <8.5 x 11 | other>
- **Source:** <where the paper form came from — NAES, site EHS, vendor>

## Field bindings

| Page | Label on paper | Binding (`content.name`) | Widget type | Notes |
|---|---|---|---|---|
| 1 | Work Area | `workArea` | `work-area-select` | |
| 1 | Permit # | — | — | **BLANK — hand-filled, do not bind** |

## Revision history
- <date> — <what changed vs superseded/>
```

## Two rules that matter

1. **Mark hand-filled blanks explicitly.** The seeder currently uses `field()` for some lines that
   are meant to be filled in by pen. That creates a real savable input whose value is silently
   discarded on save. Those should be unbound `text` containers with an underline instead.
2. **Every binding gets verified against the Java entity *and* the Angular DTO before it ships.**
   The `Loto` sheet was transcribed with plausible-looking field names that never existed on
   `Loto` — 52 of its 66 bindings resolve to nothing and print blank. Don't repeat that.

## Repo hygiene

Page scans are fine to commit (the repo already tracks ~650 small images). Keep them under a few
MB each — downsample scans to ~150 DPI grayscale unless fine print is unreadable.
