## Description

Job is open any time a work is performed on a piece of equipment - it can hold multiple daily permit packages. Daily permit package includes all the permits needed per task. Multiple tasks can be bundled under the same job. So job keeps track of daily packages for all tasks involved in the job. 

Job entity provides a way to see history of all packages or current packages.
Daily package keeps track of current permits - their statuses and modification history. 

Job can be opened manually or generated from Work Request. 

Daily Permit Package can be created manually inside the existing job or generated from work request.

Work Request becomes part of daily package - if job is generated from work request - it automatically generates DailyPackage based on the same work request. and this work request becomes part of it. For next day, if job wasn't completed, a new Work Request is submitted - it can be added to new Daily Package if it is created or it can be used to generate new daily package inside existing job. 

# Permit Relationships
Safework references: all related LOTO, CS, HW, Energized Work, Excavation, Venting

CS references LOTOs and HW

## Full Flow

Work Request is submitted (saved in DB) -> JHA filled out and attached to Work Request (Saved in DB)
    - Work Area selected (constant hazards auto-apply to permit forms)
                                    ||
                                    \/
(Manually) Job is generated(or updated) based on the Work Request:
    - Scope of work
    - Requestor
    - Daily Packages
                                    ||
                                    \/
Create Daily Package:
    - Create Safe Work (Work Area selection auto-populates constant hazards)
    - Create other permits as applicable (CS, HW, Purging, Excavation, Energized Work)
    - Assign LOTO if applicable
    - Attach Package to Job
    - Save in DB, Sync with Server
                                    ||
                                    \/
Activate Daily Package:
    - All included permits are active
    - Notify Requestor of readynness
    - Update LOTO Informational Board if applicable
    - Print field copies
    - Sign people on
    - Update Active Permits Tracker
                                    ||
                                    \/
Perform updates as needed:
    - add/remove permits to Daily Package
    - pause work
                                    ||
                                    \/
Close Daily Package:
    - Let People to Sign Off
    - Close all permits
    - Gather job status from Requestor:
        - is work completed, if not:
            - When will it continue
            - Are there any changes to work scope, if yes:
                - Submit new Work Request
        - Any comments?
                                    ||
                                    \/
Post-Processing:
    - if work wasn't complete re-evaluate work scope (comments, new Work Request)
    - reissue Daily Package from last day, make necessary adjustments
    - notify requestor of the status.

## Related Features

- [Work Areas](work-areas/overview.md) - physical plant locations with constant hazards, interactive map, and workload monitoring
- [Base Permit](base-permit.md) - common permit behavior (status, history, snapshots)
- [Work Request](work-request/work-request-architecture.md) - work request submission and processing
- [LOTO Permit](loto-permit/loto-permit-architecture.md) - lock out / tag out permits
