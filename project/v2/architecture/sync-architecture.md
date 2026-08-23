---
title: Sync Architecture
type: architecture
status: draft
deployable: []
domain: []
concern: [sync, data-integrity, networking, security]
created: 2026-08-22
updated: 2026-08-22
code_refs: []
---

# Sync Architecture

Plain language, no algorithms. Three states, and the rules that apply in all of them.

> Where this says **"not built"**, the requirement is real and the mechanism does not exist
> yet. Everything unmarked is decided.

---

## What sync is for

Several machines hold the same information and people work on all of them, sometimes while
cut off from each other. Sync's job: **when everyone can talk again, they all end up with the
same picture, and nobody's work quietly disappeared.**

---

## The one idea everything rests on

**We record what people did, not what things became.**

Not "this permit's status is now Approved" — instead "Maria approved this permit at 14:32".
The current state is worked out by replaying what happened.

Everything else follows from this. Two records of *what something became* fight each other,
because the field holds one value and one of them has to lose. Two records of *what somebody
did* can both be kept. Nothing has to be thrown away to make them fit.

---

## The three states

### State 1 — Hub on

Normal. Dave changes something on desk 1; his machine records it, applies it, sends it to the
hub; the hub passes it to every other desktop and the PWA. Maria sees it a moment later.

This is almost all of the time.

### State 2 — Hub off, internet up

**The common failure.** IT reboots servers during a plant outage, or the hub is up but its
public address is broken and stays broken until someone chases IT.

| | |
|---|---|
| **Desktops** | Keep working normally. Changes go to a **mailbox on the internet** instead of the hub, and desktops read each other's from it. Dave's permit still appears on Maria's screen — during the outage, not after it. |
| **PWA** | Uses the same mailbox. It and the hub both connect *outward*, and outward connections keep working when the inbound path is dead. |
| **On return** | The hub collects what it missed, like any other machine. Nobody re-enters anything. |

The mailbox stores and forwards. It never merges or decides anything.

**Two things this does not solve.** A mailbox that delivers one change and withholds another
can cause harm without altering a byte — so machines must be able to tell when they are behind
(see *Knowing you are behind*). And during these windows, permit data leaves the plant and sits
on a service run by somebody else, which needs someone's signature.

**Nothing currently notices this state.** The hub's health check asks itself, from inside, and
always answers yes.

### State 3 — Full blackout

Hub down, no internet. Every machine is alone.

**Nothing merges, because nothing arrives.** There is no concurrency to prevent here. The
problem is the opposite: **the work scatters** across five databases, and at handover no screen
can answer *"what is isolated right now?"*

So one desk is named — **Outage Working** — to *consolidate the record*, not to arbitrate.

- **One desk issues.** New permits are created there, and boxes and locks allocated there. The
  desk is written on the LOTO board. A person decides and signs it; there is no software
  election.
- **Nobody is stopped.** Every other desk keeps working on what it already holds — hanging,
  verifying, signing on and off, editing, reading. Tell a crew the computer will not let them
  work and you will get paper permits inside one shift.
- **The record travels by hand.** A memory stick carries changes between desks. Importing the
  same stick twice does nothing. *(Not built.)*
- **It ends when a person ends it**, not on a timer and not when the network returns. Each
  affected permit is then reconciled by a person.
- **The whole period is marked** on every change made during it, and the marking survives
  printing and export.

> **Why nothing needs enforcing.** A permit created during a blackout exists on exactly one
> machine. You cannot work it at another desk because it is not there. That is the whole
> control, and it cannot be forged because it is not a credential — it is just where the data
> is. This also settles the machine that never hears about the arrangement: nothing can stop a
> machine you cannot reach, so do not try. It cannot create a clashing permit number, and its
> work merges normally on return.

**The one real collision is the lock box.** Two isolated machines both take the lowest-numbered
free box and locks — the same ones. That is arithmetic, not bad luck, and naming a desk does not
fix it, because that desk cannot see a box taken elsewhere just before the split. What protects
the lock box is that it is a physical object on a wall. The software's job is to make a double
claim **loud** on reconnection instead of silently picking one.

---

## When two people change the same thing

These rules are the same in all three states.

| Situation | What happens |
|---|---|
| **Different fields** | Both kept. They never contended. The current system already gets this right — it tracks changes per field, not per record. |
| **Same ordinary field** — a description | One wins, the same one on every machine. Losing a description edit is annoying, not dangerous. |
| **Same safety field** — an isolation position | **Never resolved silently.** Both are kept and the field shows as **contested** until a person decides. That decision is recorded too. |
| **Adding to a list** — equipment on a LOTO point | All additions survive, because the system records "add pump 3", not "the list is now [...]". If one person adds while another removes the same item, the add wins. |
| **A workflow step** — approve, activate | Status, who, and when are recorded as **one action** that can never come apart. The old system stores them as separate fields that merge independently, producing a permit that is "Draft" *and* "approved by the manager". |
| **An approval, when content changed** | The approval is **void** and must be given again. Approving a document means approving *that* document. |

**How the system tells a disagreement from taking turns:** every change records which version
of the value the person was looking at. Change it *after seeing* someone else's and you took
turns. Change it *without having seen* theirs and you disagreed — even if yours arrived later.
Time alone cannot tell those apart.

### What the current system loses, and where

Worth being precise, because the fix differs per case:

| Loss | Where it happens |
|---|---|
| **Equipment / file lists** | Stored as one text field and overwritten whole, so concurrent additions from two machines lose one side. |
| **Changes that never leave the machine** | Changes are inferred from a database callback and can be dropped during a save, while the record itself commits. Nothing reports it. |
| **Fields reverted by SharePoint** | A SharePoint write sends every column, so a stale value can revert a field somebody else just edited. This is the only path where *different fields* interfere. |
| **Approvals that outlive their content** | Status, approver, and time are separate fields that merge independently. |

---

## The dangerous case

**The situation.** Dave signs a worker onto a permit. Maria, cut off from Dave, closes the
permit out and records the locks removed. Both were looking at correct information at the time.

**It follows the normal flow.** Both changes are kept — they touched different things, so
nothing is lost and nothing is overwritten. When they meet, the permit reads *"cleared, and
someone is signed on."*

**That state is contradictory, and the contradiction is visible in the data.** No special
protocol is needed to find it. It is a validity rule, checked the same way as any other
mismatch: certain combinations are simply not allowed to exist, and this is one of them.

### What is different is the reaction, not the detection

For a description, a conflict is a note somebody sorts out later. Here the physical act has
already happened — the locks are off — so:

- it raises an **immediate control-room alarm**, not a queue entry
- the permit shows as **disputed**
- the equipment is treated as **not clear** until a person resolves it

**And the physical check is what actually protects the worker.** Before pulling locks, someone
walks down the lock box — existing procedure, not something the software adds. A lock on the box
means somebody is signed on, whatever any screen says. The software's contribution is to record
who did that walkdown, and to shout when the record later turns out to have been incomplete.

### Where staleness comes in

The software cannot promise Maria's screen was current. No machine can prove it has everything
from a machine that is switched off.

So it does not promise. It reports what it knows: **which machines have gone quiet, and since
when.** On a normal day nothing has, and nothing is shown. The case that matters is narrow — a
machine that was working during a blackout and has not come back since — and that is something
the system can state precisely rather than guess at.

## Knowing you are behind

**Missing information must never look like information saying nothing is there.** A machine that
never received "point 7 is isolated" sees exactly what it would see if point 7 were never
isolated.

Counting each machine's changes finds interior holes — *"I have Dave's 1–40 and 42"* — but not
the one that matters: whether Dave has a 41 you never received. So each machine publishes **how
far it has got and which machines it believes exist**, and machines compare. *Caught up* means
every machine's claimed position has arrived and everyone agrees on who exists. *(Not built.)*

This needs a third state on safety fields: not just *isolated* or *not isolated* but **unknown**.
Unknown blocks permit issue, close-out, and return to service, and survives printing and export.
*(Not built.)*

---

## Where the software sits in the safety chain

This section exists because it **decides two concrete design questions**, not as a disclaimer.

**What the software is trusted for:** knowing what is isolated, who is signed on, what has been
approved, where the locks and boxes are, and proving all of that afterwards. That is the job, and
it must be right. Nothing here says otherwise.

**What it is not:** the last thing standing between a worker and energy. The padlock and tag do
that. Software is one layer; the physical control is the layer under it. Every plant is built
this way, and it is not a comment on the software's quality.

### Why this matters practically

**It is why a failed check downgrades instead of blocking.** If the record were the only
protection, a machine that could not prove it was current would have to *refuse* the clear-out —
and a refusal gets routed around onto paper, which is worse than the problem. Because the padlock
is underneath, we can let the work proceed with a loud warning and a named second checker. That
choice is only available because there is a layer below.

**It is why some things still ask a person.** Where the software *is* the practical authority —
authorising a lock to be **cut**, returning equipment to service, issuing a permit on a shared
isolation boundary, shift handover — the person deciding is at a desk with no padlock in front of
them. There the completeness of the record *is* a safety property, and the system asks rather
than guesses.

So: trusted, and not sufficient on its own. Both halves are load-bearing.

> The exact wording needs signing off by whoever owns the plant's energy control procedure.
> Which layer is credited with what is their call, not mine.

---

## What this never does

- **Promise everyone sees a change immediately.** Only that they all see it eventually and none
  are lost.
- **Let arrival order change the answer.** Two machines holding the same changes show the same
  thing, whatever route they took. *(The prototype currently fails this.)*
- **Silently pick a winner for a safety field.**
- **Treat silence as safety.**
- **Allow a second decider.** Extra routes are fine; extra authorities are not.
- **Force anyone onto paper because the network is down.** A refusal that gets routed around is
  worse than a warning that gets recorded.

---

## Not built yet

In priority order:

1. **Rules for states that must never exist** — "cleared with someone signed on" and similar. This is the answer to the dangerous case, and it is ordinary validation, not new sync machinery.
2. **Unknown as a field state**, and proving a machine is current.
3. **Carrying changes by hand** — the only transport that works in a blackout.
4. **Box and lock claims as contested** rather than silently merged. Today three separate fields
   carry the one fact of which box a permit holds, and they can settle on different answers.
5. **Something that notices state 2** from outside.

Open design questions: [[open-questions]].
