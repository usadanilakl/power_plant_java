---
title: Testing
type: convention
status: current
deployable: []
domain: []
concern: [testing, build, data-integrity]
created: 2026-08-21
updated: 2026-08-21
code_refs: []
---

# Testing

## Starting position

The current system has 77 test files against 1,552 source files — roughly 6% — and
tests are skipped by default in the build. That is the end state of having no
enforced policy, and it is the reason [[0001-rebuild-on-clean-core]] lists "no
automated oracle" as an accepted cost.

## Rules

1. **Tests run in every build.** There is no skip-by-default configuration.
2. **Coverage is enforced as a ratcheting floor on changed lines**, never as a
   global percentage.
3. **Every replication behaviour is proven by the partition simulator**, not by unit
   tests alone. A merge rule without a simulator case does not exist.
4. **Every domain migrated from the old system has characterisation tests written
   against the old system first**, and the new implementation must satisfy them.
5. **No test depends on wall-clock time or on test execution order.** Clocks are
   injected; see [[0009-hybrid-logical-clocks]].
6. **No test reaches a real external system.** SharePoint, Maximo, Supabase, and
   EtaPRO are contract-tested against recorded fixtures.

## Enforcement

| Rule | Enforced by | Fails where |
|---|---|---|
| 1 | build configuration; CI asserts the skip flag is absent | CI |
| 2 | coverage tool in changed-lines mode | CI |
| 3 | simulator suite must cover every declared merge annotation — a merge type with no case fails the build | CI |
| 4 | a domain cannot be marked migrated until its characterisation suite is green against both implementations | CI (migration gate) |
| 5 | lint rule banning direct clock and randomness access outside designated providers | CI |
| 6 | network access disabled in the test profile | test runtime |

## The layers, and what each is for

| Layer | Answers | Scope |
|---|---|---|
| **Unit** | does this rule compute correctly | one class, no Spring, no database |
| **Slice** | does this component integrate with its adapter | real database, one vertical slice |
| **Contract** | do the client and server agree on the payload | generated contracts plus recorded fixtures |
| **Simulator** | does replication converge | multiple simulated nodes, scripted partitions |
| **Characterisation** | does the new system behave like the old one | black box, both implementations |

The **simulator** layer is specific to this system and is where correctness actually
lives. Per [[0007-sync-built-in-house]] it is built *before* the replication engine.
Its cases must include clock skew, clock reset, long partition, three-way partition,
and same-field concurrent edit.

## What is deliberately not required

- No coverage target for generated code — it is not hand-written and its correctness
  is the generator's.
- No end-to-end UI test requirement. These are expensive and brittle; where a
  journey genuinely needs proving, it is a characterisation test against the API,
  not the browser.

## Known exceptions

None yet.
