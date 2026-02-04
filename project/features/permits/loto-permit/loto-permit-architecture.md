## Description

Main differences between LotoStandard and LotoPermit
    - LotoStandard references LotoPoints, LotoPermit takes snapshot of current LotoPoints (changes to loto point table will not reflect in LotoPermit)
    - LotoPermit has status: Building, Active, Closed, Test
    - LotoPermit has association with other permits: WorkRequest, SafeWork, HotWork, ConfinedSpace
    - LotoPermit has association with LotoBox and LotoLock (1 box per LOTO and 1 lock per LotoPoint in the LOTO)
    - LotoPermit has permit number
    - LotoPermit has association with people - Requestor, ControlAuthority, AffectedPerson

## Functionalities

1. LOTO Permit query - table
2. LOTO Permit CRUD  - form
3. LOTO Permit Info Board - overview component that shows connections between LotoPermits, Boxes and People

## Acceptance Criteria

1. Table should be searchable/sortable/paginated/infinite scroll
2. User can create LotoPermit from LotoStandard
3. User can create LotoPermit from scratch
4. User can modify LotoPermit that was created from LotoStandard - all fields, add/remove/reorder loto points - changes do not affect the Standard
5. User can modify LotoPoits assigned to LotoPermit without affecting LotoStandard or LotoPoint (just snapshot)
6. User can create a new LotoPoint directly from LotoPermit form (just like LotoStandard Builder)
7. Editing existing LotoPermits:
    - Full edit is allowed for LotoPermits with status "Building"
    - No edits are allowed "Closed" permits
    - When LotoPermit gets status "Active" - a full snapshot is taken, that is not editable from this point. 
    - "Active" permits can only have one change: Status (Active to Test or Active to Closed)
    - LotoPermits under "Test" gane full edit ability, but all edits are separated from original LotoPermit snapshot, from now on a new LotoPermit snapshot is being built - when active loto is put in test, original snapshot is copied and set as modification snapshot that is accepting all incoming changes until LOTO is activated again. At this point the mod snapshot is not editable - cycle repeats - if LOTO is put in test again, copy of last mod snapshot is made and all incoming changes are reflected in it and so on. 
8. User can user form to view LotoPermit details:
    - Regular info fields (Name, Description, Requestor, Control Authority, Scope of Work)
    - LotoPoints
    - Associated files (derived from LotoPoints)
    - History - snapshot viewer
    - Log - people signing on and off (AffectedPerson)