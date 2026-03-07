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

## Field Type Kinds

- `2` = Text (single line, 255 chars)
- `3` = Note (multi-line text)
- `8` = Boolean (Yes/No)

## Default View Fix

SharePoint does NOT automatically show newly created fields in the default list view. After adding each field to the list, the provisioner also calls:

```
POST /_api/web/lists/getbytitle('{listTitle}')/DefaultView/ViewFields/addviewfield('{fieldName}')
```

This ensures columns are visible when opening the list in SharePoint.

## Files

- `sevice/sharepoint/SharePointListProvisioner.java` — list definitions + provision logic
- `sevice/sharepoint/SharePointCertificateAccess.java` — REST API calls (createList, addFieldToList, addFieldToDefaultView)
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
