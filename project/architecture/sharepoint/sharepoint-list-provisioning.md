# SharePoint List Provisioning

## Overview

Automatically creates SharePoint lists with the correct columns for all permit types. This replaces manual list creation in SharePoint admin, ensuring consistent schema across environments.

## How It Works

1. `SharePointListProvisioner` defines all lists and their fields in code (single source of truth)
2. Each list definition specifies field names and SharePoint `FieldTypeKind` values
3. On provision: creates the list (BaseTemplate 100 = generic list), adds each field, then adds each field to the default view so columns are visible in SharePoint UI

## Lists and Fields

| List | Fields | Types |
|------|--------|-------|
| Safe Work Permits | PwaId, Date, Time, CompanyPerson, LocationOfWork, SpecialInstructions, RequestedBy, Status | All Text |
| Hot Work Permits | PwaId, Date, Foreman, FireWatch, MeterModel, MeterNum, SpecialInstructions, LocationOfWork, Status | All Text |
| Confined Space Permits | PwaId, Date, Time, SpaceToBeEntered, IssuedTo, Duration, MeterModel, MeterNum, Calibrated (bool), Status | Text + 1 Boolean |
| LOTO Permits | PwaId, EquipmentSystem, LotoRequestor, Date, BoxNumber, Status | All Text |
| Work Requests | PwaId, DateOfWork, WorkRequestedBy, Company, LocationOfWork, AffectedEquipment, IsLOTORequired (bool), IsHotWorkRequired (bool), IsConfinedSpaceEntryRequired (bool), ForemanName, FireWatchName, SpaceToBeEntered, Status, SubmitterName/Email/Phone/Company, TimeSubmitted | Text + 3 Boolean |
| JHA | PwaId, JobName, Applicability, AnalysisBy, ReviewedBy, ApprovedBy, Date, PPE, LOTO, ConfinedSpace, HazCom, HandAndPowerTools, SpecialTools, WorkRequestSharepointId, SubmitterName/Email/Phone/Company, TimeSubmitted, Status, JobSteps (note) | Text + 1 Note |
| Energized Work Permits | PwaId, Date, Time, LocationOfWork, IssuedTo, WorkOrder, CircuitDescription (note), WorkDescription (note), Justification (note), Requester, RequesterDate, QualifiedPersonSignature/Date, PlantManagerSignature/Date, WorkCanBePerformedSafely (bool), Status | Text + 3 Note + 1 Boolean |
| Excavation Permits | PwaId, Date, Time, LocationOfWork, IssuedTo, Supervisor, JobLocation, SupervisorPhone, ExcavationDescription (note), WorkOrder, LocationPipingMarked (bool), FacilityName, CompetentPerson, SoilType, ExcavationDepth/Width, ProtectiveSystemType, Status | Text + 1 Note + 1 Boolean |
| Venting Permits | PwaId, Date, Time, LocationOfWork, IssuedTo, PlantName, SystemName, RequestingIndividual, Purpose (note), TimeCommence, TimeConclude, GasType, LEL, UEL, CalculatedVolume, Pressure, GasIndicatorModel/Serial, CalibrationDate, Status | Text + 1 Note |

## Additional Lists

| List | Fields | Types |
|------|--------|-------|
| Instrumentation | PwaId, Tag Number, Description, Vendor, Location, Type, CurrentStatus, LastUpdatedDate/Time/By, LastComment (note) | Text + 1 Note |
| Instrumentation Log | PwaId, Tag Number, InstrumentId (lookup→Instrumentation.ID), Description, Status, Date, Time, Name, Comment (note) | Text + 1 Lookup + 1 Note |
| Field Lists | PwaId, ListType, Status, Location, SpecificLocation, Notes (note), DateObserved, EquipmentTag, SubmitterName/Email/Phone | Text + 1 Note |
| Qualification Catalog | PwaId, QualificationCode, QualificationName, QualificationType, Description (note), RequiresExpiration (bool), DefaultValidityMonths, IsActive (bool), SortOrder, Notes (note) | Text + 2 Boolean + 2 Note |
| Employees Qualifications | PwaId, UserId, UserName, UserEmail, WindowsUsername, Role, QualificationId, QualificationCode, QualificationName, QualificationType, Status, IssuedDate, ExpirationDate, CredentialNumber, Issuer, Notes (note) | Text + 1 Note |

## Field Type Kinds

- `2` = Text (single line, 255 chars)
- `3` = Note (multi-line text)
- `7` = Lookup (reference to another list)
- `8` = Boolean (Yes/No)

## Column Indexing

The provisioner automatically indexes columns on each list to prevent the SharePoint 5,000-item list view threshold error.

### How It Works

- Runs after field creation via `ensureIndexes()` — idempotent, skips already-indexed columns
- **NOTE** fields (multi-line text) cannot be indexed — skipped automatically
- **LOOKUP** fields are auto-indexed by SharePoint — skipped
- **TEXT** and **BOOLEAN** fields are indexed in priority order:
  1. **Built-in `Modified`** column — always indexed first (critical for incremental sync queries)
  2. **High priority**: `PwaId`, `Status`, `CurrentStatus` — most commonly filtered
  3. **Medium priority**: Date fields (`Date`, `DateOfWork`, `TimeSubmitted`, etc.)
  4. **Low priority**: All remaining TEXT/BOOLEAN fields
- Maximum **20 indexes per list** (SharePoint limit) — if reached, logs a warning and stops

### API Used

```
MERGE /_api/web/lists/getbytitle('{listTitle}')/fields/getbyinternalnameortitle('{fieldName}')
Body: {"Indexed": true}
```

Check if indexed:
```
GET /_api/web/lists/getbytitle('{listTitle}')/fields/getbyinternalnameortitle('{fieldName}')?$select=Indexed
```

## Safe Re-Run Behavior

The provisioner is fully **idempotent** — safe to run on existing lists with data:
- **Lists**: checks `listExists()` before creating — existing lists are not recreated
- **Fields**: checks `fieldExists()` before adding — existing fields are skipped
- **Indexes**: checks `isFieldIndexed()` before indexing — already-indexed columns are skipped
- **Data**: never deletes, modifies, or reads list items — only schema operations
- Running on an existing list will add any **new** fields and indexes defined in code but missing from SharePoint

## Default View Fix

SharePoint does NOT automatically show newly created fields in the default list view. After adding each field to the list, the provisioner also calls:

```
POST /_api/web/lists/getbytitle('{listTitle}')/DefaultView/ViewFields/addviewfield('{fieldName}')
```

This ensures columns are visible when opening the list in SharePoint.

## Files

- `sevice/sharepoint/SharePointListProvisioner.java` — list definitions + provision logic
- `sevice/sharepoint/SharePointCertificateAccess.java` — REST API calls (createList, addFieldToList, addFieldToDefaultView, indexField, isFieldIndexed)
- `controller/angular/permits/NgSharePointProvisioningController.java` — REST endpoints

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/ng/sharepoint/list-status` | Check exists/missing status for all lists |
| POST | `/ng/sharepoint/provision-list?title={title}` | Create a single list with all its fields |
| POST | `/ng/sharepoint/provision-lists` | Create all missing lists |

## Admin UI

Located in the Admin Functionalities page (`/app/admin`), section "SharePoint List Provisioning":

- **Refresh Status** — fetches status of all 9 lists (exists/missing/error)
- **Create All Missing** — provisions all lists that don't exist yet
- Each list shown as a card with:
  - Title, field count, status badge (Exists/Missing/Error)
  - **Create List** button (if missing)
  - **Open in SharePoint** link (if exists) — opens the list at `https://jpowerusa.sharepoint.com/sites/JG/Lists/{title}`
