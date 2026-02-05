## Description

1. Base Permit Class provides basic common behavior for all permits:
    - Permit Number
    - Status
    - History with time stamps
    - Snapshot
    - Database Fields (from base entity)

## Functionalities

1. Permit query - table
2. Permit CRUD  - form

## Acceptance Criteria

1. Permit Table should be searchable/sortable/paginated/infinite scroll [TableComponent](../../../frontend/src/app/shared/table/refactored/table.component.ts)
2. User can user Permit form to create a new Permit.
3. Editing existing Permit:
    - Full edit is allowed for Permits with status "Building"
    - No edits are allowed for "Closed" permits
    - When Permit gets status "Active" - a full snapshot is taken, that is not editable from this point.
    - "Active" permits can only have one change: Status (Active to Test or Active to Closed)
    - Permits under "Test" gane full edit ability, but all edits are separated from original Permit snapshot, from now on a new Permit snapshot is being built - when active permit is put in test, original snapshot is copied and set as modification snapshot that is accepting all incoming changes until Permit is activated again. At this point the mod snapshot is not editable - cycle repeats - if Permit is put in test again, copy of last mod snapshot is made and all incoming changes are reflected in it and so on.
4. User can use form to view Permit details:
    - Regular info fields (Name, Description, Requestor, Scope of Work)
    - History - snapshot viewer

