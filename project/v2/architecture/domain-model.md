---
title: Domain Model — the spine
type: architecture
status: draft
deployable: []
domain: []
concern: [storage, build]
created: 2026-08-22
updated: 2026-08-22
code_refs:
  - src/main/java/com/dk_power/power_plant_java/entities/physical/PhysicalObject.java
  - src/main/java/com/dk_power/power_plant_java/entities/equipment/Equipment.java
---

# Domain Model — the spine

Built on the owner's own framing: **the backbone is physical objects and people, and
everything else references them.** That is the right idea and it is what the current model
lacks — 141 entities grew with no spine to hang from.

This document tests that framing against every entity package in the codebase, adds what was
missing, and answers the two questions the original left open.

---

## Three spines, not two

Everything in the system is ultimately about one of three things:

| Spine | What it is | Answers |
|---|---|---|
| **Physical** | What exists in the plant | *what* |
| **People** | Who works here, what they are qualified for | *who* |
| **Work** | What is being done, or was done | *what is happening* |

The original had two. **Work is the missing one**, and it is the largest part of the system:
permits (33 entities), rounds (14), scheduler (5) — **52 entities**, roughly a third of the
model.

The reason it was missed is subtle. A permit *feels* like it attaches to a physical object,
so it was listed there. But it doesn't: a permit attaches to a **job**, which involves objects
*and* people *at a time*. Rounds are the same — a Round is a procedure, a RoundInstance is
work done by a person at a time. Filing these under "physical" forces the model to pretend
work is a property of equipment, which is how you end up with permit state scattered across
equipment-shaped tables.

**The test for any feature: it attaches to exactly one spine.** If it attaches to two, it is
probably a relationship and deserves its own entity. If it attaches to none, it is platform.

---

## The structure

### Spine

```
Physical    the plant as a tree: sites, areas, systems, objects
            identity, tag number, location, parent, drawings it appears on

People      users, roles, qualifications, companies, contractors

Work        Job → Daily Package → Permit → Task
            Round → Round Instance
            Order
```

### Attached to Physical

| | Notes |
|---|---|
| **LOTO Point** | Always an object; not every object is one. A *role* an object plays |
| **Instrumentation** | |
| **Inventory** | Parts held at a location |
| **SDS** | Chemicals held at a location |
| **EtaPRO tag** | A reading source on an object |
| **Maximo asset / location** | External identity for the same object |
| **Fire impairment** | A condition on an object, for a period |

### Attached to People

| | Notes |
|---|---|
| **Schedule** | Who is on shift when |
| **Messaging** | |
| **Ordering** | Who ordered what |
| **Qualifications** | What a person may do — drives the LOTO role rules |

### Attached to Work

| | Notes |
|---|---|
| **All permit types** | SafeWork, LOTO, Hot Work, Confined Space, Energized, Excavation, Venting, JHA |
| **Work Request** | The thing that starts work |
| **LOTO Standard** | A *template* for work, not work itself — sits beside Work, not under it |
| **Round instance** | |
| **Log entries** | What happened, when |

### Reference — small, boring, shared by everything

Category / Value (runtime enums) · Field List · Work Category · Hazard profiles

### Platform — not features, and they cost more than features

Sync · Files · Auth · Integrations (SharePoint, Maximo, EtaPRO, Supabase) · Form engine ·
Rendering (2D, 3D, simulator) · Email · Logging

The original document has no home for these, and they are **33 entities and roughly 60,000
backend lines**. They are not features and should never be planned as features — but they
must appear somewhere or they get planned by accident.

---

## The two open questions, answered from the code

### 1. Should Equipment be a physical object, or a separate entity?

**They are the same thing, modelled twice.** Both carry tag number, description, specific
location, and system. That is not two concepts; it is one concept built twice, years apart,
for two different screens.

What `Equipment` has that `PhysicalObject` does not splits cleanly in two:

| Extra fields on Equipment | What it actually is |
|---|---|
| `coordinates`, `rotation`, `mainFile`, `originalPictureSize`, `highlight` | **Where the object is drawn on a drawing** |
| `lotoPoints`, `breakers`, `heatTraceList` | **Connections to other objects** |

Neither belongs on the object.

**Placement is a relationship, not a property.** One object appears on many drawings — a P&ID,
a one-line, a floor plan — at different coordinates on each. Storing `coordinates` on the
object means it can only ever be on one. That constraint is already in your data.

So: `PhysicalObject` (identity, location in the plant tree) + `Placement` (object, drawing,
coordinates, rotation) + `Connection` (object, object, kind).

**Equipment disappears as an entity.** It becomes a physical object that happens to have LOTO
points and placements.

### 2. Should Work Area be a physical object, or separate?

**A physical object, of type AREA.** An area is a region of the plant — it has a location, it
contains other objects, it sits in the tree. That is exactly what the spine is for.

Its hazard configuration (constant hazards, hot-work measures, confined-space hazards,
predefined LOTOs) is an **attribute of the area**, not a reason to make it a different kind of
thing.

### 3. And the one not asked: is a LOTO Point an entity or a role?

Your own note says it: *"it is always an equipment, but not all equipment are loto points."*
That is the definition of a **role an object plays**, not a separate kind of thing.

A LOTO Point is a physical object plus: a tag number in the LOTO scheme, isolation positions,
a zero-energy method, and characteristics. Modelling it as its own entity duplicates identity
and is why LOTO points and equipment have to be kept in step by hand today.

---

## Why this matters more than the feature inventory

The [[feature-inventory]] tells you what to **drop**. This tells you what to **build**, and in
what order:

1. **Spine first** — Physical, People, Work. Nothing else can be modelled until these exist.
2. **Then the attachments**, one at a time, in the order the feature inventory prioritises.
3. **Platform alongside**, driven by what the spine needs — not designed up front.

It also gives you a rule that prevents the drift that caused this rebuild:

> **Every new entity attaches to exactly one spine, or it is platform. Anything that attaches
> to two is a relationship and gets its own entity.**

Comma-separated id lists, JSON blobs holding other entities' ids, and the same fact stored on
both sides of a relationship are all symptoms of that rule not existing. There are 133 JSON
fields and 9 comma-separated id fields in the current model.

---

## What this does not settle

- Whether **Job** and **Daily Permit Package** are both needed, or one is a view of the other.
- Where **Log** lives — it reads like Work, but plant logs are often about objects.
- Whether **LOTO Standard** is Work or Reference. It is a template, so it may belong with
  Category/Value and the form definitions rather than beside live work.
- **Time.** Schedule, shifts, and round instances all have a strong time dimension. It may be
  a fourth spine or merely an attribute — worth deciding before building Work.
