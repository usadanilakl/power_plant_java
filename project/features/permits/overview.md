## Description

## Full Flow

Work Request is submitted (saved in DB) -> JHA filled out and attached to Work Request (Saved in DB)
                                    ||
                                    \/
(Manually) Job is generated(or updated) based on the Work Request:
    - Scope of work
    - Requestor
    - Daily Packages
                                    ||
                                    \/
Create Daily Package:
    - Create Safe Work
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

