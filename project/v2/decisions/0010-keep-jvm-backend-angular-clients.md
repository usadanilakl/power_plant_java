---
title: Keep the JVM for the backend; Angular and Electron for the clients
type: decision
status: current
deployable: []
domain: []
concern: [build, integration, storage, performance]
created: 2026-08-21
updated: 2026-08-21
decision_date: 2026-08-21
code_refs:
  - electron-manager/src/main/paths.ts
---

# ADR-0010: Keep the JVM for the backend; Angular and Electron for the clients

## Status

`current`

## Context

[[0004-three-deployables-multi-master]] settles *what* the deployables are. This
record settles what they are built with.

The existing stack is Spring Boot on both the hub and the desktop, Angular for both
user interfaces, and Electron as the desktop shell. Java is the only JVM language in
an otherwise TypeScript project, which raises a fair question: would a single-language
stack — Nest or similar on Node — be better?

The strongest argument for moving is the desktop runtime. Electron already ships
Node, so a TypeScript backend would run inside it: one runtime instead of two, no JVM
warmup, a smaller install. That argument was tested against the actual artifact.

### What the desktop install is actually made of

Measured 2026-08-21:

| Component | Size |
|---|---|
| `target/power_plant_java-1.jar` | 629 MB |
| Bundled JRE (`electron-manager/jre`) | 146 MB |

Inside the jar:

| Contents | Size | Language-dependent? |
|---|---|---|
| `static/angular/…/qa-data` help media | ~160 MB | no — content |
| `h2db/testdb.mv.db` | 77 MB | **no — a test database shipped to production** |
| OpenCV | 74 MB | no — native library |
| Microsoft Graph SDK | 54 MB | partly — a fat SDK choice |
| `brady.zip` | 30 MB | no — vendor payload |
| FFmpeg | 29 MB | no — native library |
| Jython (SikuliX) | 15 MB | yes |
| Tesseract `tessdata` | 15 MB | no — model data |

**The JVM is roughly 146 MB of a ~900 MB install.** The remaining bulk is content and
native libraries that need to exist regardless of which language calls them. OCR and
image processing require the same binaries under Node.

Removing the JVM therefore recovers something like 16% of the install size, in
exchange for rewriting roughly 32,000 lines of integration glue.

The 77 MB test database and the ~160 MB of help media in the production artifact are
build hygiene defects, not stack properties. Fixing those alone recovers more than
switching languages would.

## Decision

- **Hub and desktop backend: Spring Boot on the JVM.**
- **Both user interfaces: Angular.**
- **Desktop shell: Electron.**
- **PWA: Angular, statically hosted.**

The wire boundary between Java and TypeScript is handled by generation, per
[[0005-monorepo-generated-contracts]], not by hand.

## Rationale

**Transactional integrity is the backbone of the new design.**
[[0007-sync-built-in-house]] requires the op-log entry to be written in the *same
transaction* as the data it describes. Spring makes that declarative and close to
free. In Node it means threading a transaction handle through every call, or building
context plumbing — manual discipline in exactly the place the current system already
fails. That is the worst possible location for a new source of human error.

**The integration glue stays reusable.** ~32k lines encode knowledge won by hitting
real walls: SharePoint certificate authentication and field encoding, Maximo write
semantics, EtaPRO. A Java-to-Java port is cheap. A Java-to-TypeScript rewrite
re-derives all of it.

**Too many hard things at once.** The rebuild already involves hand-writing a
replication engine and migrating 1.4 GB of live plant data. Adding an unfamiliar
backend ecosystem stacks a third independent risk into the same project.

**The data model suits JPA.** A relational model with an inheritance hierarchy
(`BaseIdEntity → BaseAuditEntity → BasePermitEntity`). Prisma handles inheritance
poorly, Drizzle sits close to raw SQL, and MikroORM is the only near-analogue to
Hibernate. None is a clear upgrade.

## Alternatives considered

| Option | Why not |
|---|---|
| **All TypeScript (Nest)** | The best single-language candidate — DI, decorators, and modules make it a deliberate Spring analogue. Rejected on the four points above. Its single genuine win, the one-runtime desktop, measures at ~146 MB of ~900 MB. |
| **Kotlin on Spring** | Keeps every JVM advantage and modernises the language, but solves none of the stated problems. The complaint was "only Java in the project"; Kotlin is still not TypeScript. Marginal gain, real migration cost. |
| **Hybrid — Spring hub, Node desktop** | Would require two implementations of the replication engine, which is the most correctness-sensitive code in the system. Strictly worse than either uniform choice. |
| **Replace Angular in one client** | Forfeits the shared `ui` package from [[0005-monorepo-generated-contracts]]. Two apps on identical Angular and TypeScript versions is what makes sharing viable at all. |

## Consequences

**Accepted costs.**

- Two languages, permanently. The wire boundary must stay generated, never
  hand-maintained, or the drift returns.
- The replication engine cannot be shared with the PWA as a package. This is smaller
  than it appears — [[0008-two-sync-mechanisms]] establishes the PWA needs an outbox,
  not the merge engine.
- The desktop ships two runtimes and pays JVM startup time.
- The install stays large unless the build hygiene issues above are fixed separately.

**Obligations this creates.**

- **Do not write the op-log through Hibernate lifecycle callbacks.** The emission-loss
  defect in the current system came from inferring changes via `@PostUpdate` and
  losing them to a mid-commit flush. Write op-log rows explicitly — JDBC or jOOQ —
  inside the same transaction. The "less magic" instinct behind the all-JS proposal
  is correct; it simply does not require leaving the JVM.
- Keep the generated contract boundary enforced in CI.
- Treat artifact contents as a build concern with its own check: no test fixtures, no
  databases, and no large media inside the deployable.

## Revisit if

The PWA turns out to need the full merge engine rather than an outbox. That is the
one scenario where a shared TypeScript replication package would repay the rewrite,
and [[0008-two-sync-mechanisms]] names the signal to watch — PWA users routinely
editing existing records while offline.
