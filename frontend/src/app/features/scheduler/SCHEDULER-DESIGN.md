# Scheduler System Design

## Overview
A pyramid-shaped, dependency-driven task board for power plant shift work. Work flows top-down: older/parent items at the top, children fan out below. Nothing starts until its prerequisites complete.

## Three-Level Hierarchy

```
Flow (continuous, shift-based)
 └── Task (block in the flow)
      └── Step (sub-block within a task — forms its own mini-pyramid)
```

- **Flow** — A continuous, rolling chain of work. Shift-based: one shift rolls into the next. Not a finite project.
- **Task** — One discrete block of work within a flow. Rendered as a block in the top-level pyramid.
- **Step** — A sub-action inside a multi-step task. Rendered as a block inside the task's nested pyramid. Max depth = 1 (steps don't nest further).

Steps have full capabilities — their own attachments, references, status, assignee.

## Continuous Shift Work

Flows are always-on. Shifts roll over — incomplete tasks carry forward. Task categories:
- **Recurring** — repeat every shift or on a schedule. Created from Task Templates.
- **Occasional** — appear periodically, triggered manually or by schedule.
- **One-time / Custom** — ad-hoc tasks for a specific shift.

Older completed tasks collapse/fade; active work stays visible.

## Dependency Model (DAG)

- Tasks form a **directed acyclic graph**, not a tree — a task can have **multiple parents**.
- Dependencies are **within the same Flow only**.
- **Sequential gating**: a block cannot start until all prerequisites are completed.
- **Blocked/Ready are computed** at render time, not stored.

```
        ┌──────────┐
        │  Task A   │  ← root
        └────┬─────┘
       ┌─────┴──────┐
  ┌────┴───┐   ┌────┴───┐
  │ Task B │   │ Task C │  ← both depend on A
  └────┬───┘   └────┬───┘
       └──────┬─────┘
         ┌────┴───┐
         │ Task D │  ← depends on BOTH B and C
         └────────┘
```

## Block Statuses

```
Not Started → Blocked (auto, prerequisites incomplete)
            → Ready (auto, all prerequisites met)
            → In Progress (manual)
            → Completed (manual)
            → Skipped (manual override)
```

## Attachments & References

**Attachments** — files owned by the block (lifecycle tied to block):
- Documents (PDF, Word, Excel), Images, Media (video, audio)

**References** — links to existing domain entities (not owned):
- FileObject, Permits (SafeWork, HotWork, ConfinedSpace, LOTO, etc.), User, Equipment, Location, Schematic
- Future: Procedure (Excel file in a defined format, viewable as flow in-app)
- Polymorphic: stored as (type, id) pairs. Open set — add/remove types freely.

## Templates

**Task Templates** — reusable blueprints for tasks with pre-defined steps, references, priority.
**Flow Templates** — reusable blueprints for entire flows with task templates and pre-wired dependency graphs.

Editing a template does not affect already-instantiated items.

## Rendering

**Cytoscape + cytoscape-dagre** for DAG visualization (both already in package.json).
- Top-down layout respecting multiple parents
- Built-in pan, zoom, node selection, edge routing
- Canvas-based rendering
- Replaces the D3 `d3.tree()` prototype (which can't handle multi-parent DAGs)

## Visual Design

- Block color encodes status: gray (not started), blue (ready), yellow (in progress), green (completed), red (blocked)
- Multi-step tasks show a step count badge; click to expand into nested pyramid
- Click any block → detail sidebar with info, attachments, references, status controls
- Table/list view as alternative to pyramid view
- Breadcrumb navigation: Flow > Task > Steps

## Entity Model

- Single `Task` entity with `taskLevel` enum (TASK/STEP) — recursive via parentTask/subTasks, max depth 1
- `prerequisites: Set<Task>` (ManyToMany) for DAG dependencies
- `attachments: Set<FileObject>` (ManyToMany) for owned files
- `references: Set<TaskReference>` for polymorphic entity links
- `TaskTemplate` and `FlowTemplate` entities for reusable blueprints
