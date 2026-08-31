# Guided work request submission, 2026-08-30

The full form asks a contractor twenty-odd questions at once, most of which only matter because of
an answer further up. The wizard walks the same questions in the order they actually depend on each
other, and uses earlier answers to fill in later ones.

## It is a re-presentation, not a rewrite

Every field already existed on `WorkRequest.toFormFields()` — the map picker, the equipment picker,
the hot-work chain down to the Cr(VI) assessment, the confined-space chain, `showWhen`. Each step
renders the **same shared reactive form** with a filtered field-name list, so a validator or a new
field is authored once on the model and both surfaces get it. There is no second copy to drift.

## Two backend gaps had to close first

1. **Work-area hazards and LOTO ids were not in the PWA payload.** `toWorkAreaMap` sent
   `isConfinedSpace` but not `constantHazards` / `constantHotWorkMeasures` /
   `constantConfinedSpaceHazards` / `constantLotoIds`, so "picking the area seeds its hazards" was
   not possible. Added to the one method shared by the live endpoint and the offline snapshot —
   the code already notes those two had drifted apart once.

   `constantLotoIds` comes from a **projection query**, not from the entity: both callers run
   outside a transaction, and `constantLotos` is lazy. Reading it there is precisely the
   `LazyInitializationException` that cost a day earlier this week. The hazard getters deserialize a
   JSON column and *rethrow* on malformed content, so they are read defensively — one bad area must
   not take down the whole reference snapshot and the map picker with it.

2. **Work-category profiles were not published.** `work-categories.json` was `{id, name}`, so work
   type could only seed hazards while online. An offline submission would carry fewer hazards than
   the same job typed in at a desk — the worst kind of difference to ship.

## And one that was already breaking things

`publishAll()` is called from the four places that write work areas **through the service layer**.
It is not called when one arrives by CRDT sync. So a hub that RECEIVES its work areas never
republishes, and `work-areas.json` sits at `[]` — which is exactly why the PWA map picker and the
permits map both had nothing to draw.

Adding a fifth call site in the sync apply path is the wrong shape twice over: it puts PWA
publishing inside the sync hot path, and it leaves the next write path to remember a rule that has
already been forgotten once. `PwaSnapshotReconciler` instead compares a cheap fingerprint (row
count + newest modification, for areas and shapes) every ten minutes and republishes when it moves.
Correct regardless of how the data got there — service save, sync apply, restore, or a manual fix.

## Seeding only ever turns hazards ON

Never off, and the requester always wins.

- A hazard they tick, nothing automatic may remove.
- A hazard they **untick is remembered**. Re-seeding happens whenever the area or work type
  changes, which can be after the hazards step has been reviewed — if seeding could clear, changing
  the area at the last moment would silently undo that review. That is the classic way a wizard
  destroys the answer it just asked for.
- Confined space keeps the rule the original form established: a "Yes" the requester chose
  themselves is never downgraded, because they may know about an entry the area record does not.

## Steps

| step | minimum to continue |
|---|---|
| Location — map, or free text if they cannot find it | an area **or** 3+ characters of text |
| Equipment — picker, or describe it | any text |
| Work — type (seeds its hazards), scope, hot-work chain | 2+ words; hot work needs foreman + fire watch; welding needs method + chrome content |
| Hazards — review what was seeded | none; this step exists to be read |
| You | name + company — **skipped entirely** when device setup already has them |

The 3-character location floor matches `WorkAreaLocationResolver`'s own minimum, so text that names
an area places the request on the permits map automatically and text that does not lands in "Not on
the map" for an operator to place.

## Escape hatches

- **Resubmit** opens the full form directly. Someone reusing a previous request knows the questions
  and wants to change two fields; six steps would be worse. It doubles as the route for anyone who
  simply prefers the form.
- **"Skip the guide"** on every step.
- **Clear form** on the full form empties everything *except* name and company — the common case is
  "same person, completely different job", and those are the fields least likely to be wrong.
  Attachments are dropped: they belonged to the previous request, and carrying a stale photo onto a
  new one is worse than losing it.

## Not done

- The wizard hands off to the full form for the final review rather than rendering its own summary.
  Cheap, and it means the review screen is the thing that has always been submitted.
- Draft state saves through `WorkRequestStateService.saveDraft` on every change, but there is no
  resume-where-you-left-off prompt yet.

## Map-first location step

The map is the question, so it is now the whole screen — not a control inside a form, under a label,
above an unrelated detail field.

The step has two phases rather than two steps, because "where?" is one question and growing the step
indicator to six would misrepresent how long the form is:

1. **map** — the plant map on its own, with the escape hatch and the plant-wide scopes drawn on it.
2. **detail** — one free-text field, plus a line confirming what was chosen and a Change link back.

**The escape hatch moved onto the map.** It was a checkbox *below* the map inside the host form,
which on a phone meant it was only discoverable by scrolling past the very thing you had just
failed to use. Both ways of answering are now visible at the moment of deciding.

### Plant-wide scopes

Site Wide / Unit 1 / Unit 2, as buttons above the map. Some jobs genuinely do not sit in one drawn
area, and forcing those onto a shape produces a confident lie about where the work is.

Each label is **matched against the loaded work areas by name**. If an admin has created a real
"Site Wide" work area the button behaves exactly like tapping a shape — same selection, same hazard
and LOTO seeding. If no such area exists the label is recorded as location text instead, which is
what the requester would have typed anyway, and the hub's own `WorkAreaLocationResolver` will place
it on the permits map by itself if the area is created later.

Deliberately not a new concept: a scope is just a work area that has no shape, so it carries the
same hazards, seeds the same way, and needs no special case anywhere downstream.

### A trap this surfaced

Both location fields are gated on `showWhen: workAreaUnknown`, and that control is no longer
rendered — the map's skip button owns the decision now. But `shouldShowField()` returns **false**
when a `showWhen`'s controlling field is absent from the form, so leaving the conditions in place
would have hidden BOTH fields and left the step blank. The wizard picks the branch directly and
strips the condition, which is the honest version of what it meant.

## What makes an area a confined space

Not the area type, and not `Value.name` — `PwaReferenceDataService.hasConfinedSpaceHazards` returns
true when **any one** of the area's ten Constant Confined Space Hazards is ticked (oxygen
deficiency, flammable gas, combustible dust, toxic gas, rotating equipment, electrical shock,
entrapment, engulfment, heat stress, other).

Worth revisiting: the rule is implicit, and silence means "not a confined space". A genuine confined
space nobody has filled hazards in for does not register, and nothing anywhere says it should have.
An explicit flag with the hazards as separate detail would fail safer.

## Three fixes after first use, 2026-08-31

All three were the same class of mistake: the code did what it said, and what it said was not what
the requester experienced.

### A second area could not be selected

`onAreasPicked` advanced to the detail phase on the first pick, so the screen moved on before the
requester could tap a second shape. Multi-select was implemented and unreachable.

The map phase now stays put and ends on an explicit **Continue**, disabled until at least one area
is chosen. The picker stops closing its overlay after each pick too — in multi-select the next thing
somebody does is usually pick another area, and closing each time makes selecting three a chore.

### The map was not the first thing on screen

Two causes, both fixed:

- On a phone the picker renders a **"Select Work Area" trigger** and keeps the map behind an
  overlay. That is right when the map is one field among many and wrong when the map IS the
  question — the requester was told to tap their area and got a button and some options instead.
  A new `autoOpen` input opens straight into the map; it is off by default so every other host is
  unaffected.
- On a wider screen the hint, the scope shortcuts and the escape hatch all rendered ABOVE the map,
  so the options were what you saw. The bar moved below it. The scope shortcuts are now also
  rendered inside the mobile overlay, where they were previously invisible — which is exactly when
  a "this covers the whole unit" answer is most likely.

### Work type blocked the step

`workCategoryName` carries `Validators.required` on the full form, so the reactive form refused to
advance even though the step's stated minimum is a couple of words of work scope. Two gates, and the
one stopping the requester was not the one they had been told about.

The wizard now strips `Validators.required` from the fields it renders and relies on its own
per-step rule, so there is one gate and it is the one on screen. Only `required` is removed —
anything else a field validates still applies, because those describe the value rather than whether
an answer is owed. The hot-work chain is still enforced by the step rule when hot work is Yes.
