## Description

Work request is submitted by people who will be performing work. It includes the following information:

1. Person requesting
2. Date of work to be performed
3. Affected Equipment
4. Scope of work
5. Associated Permits:
    - Hot work, if so then:
        - Supervisor
        - Fire-Watch
    - Confined Space, if so:
        - Space(s) to be entered
    - Energized work
    - Purging
    - Excavating
6. Attachments (optional):
    - pdf/jpg
    - video
7. JHA for the work to be performed (separate permit form)

WorkRequest will extend BasePermit so it will also inclue include all fields from there

## Acceptance Criteria

# New Request
1. Restrict time selection - no past is allowed.
2. Required fields:
    1. Person requesting
    2. Date of work to be performed
    3. Affected Equipment
    4. Scope of work
    5. Associated Permits:
        - Hot work, if so then:
            - Supervisor
            - Fire-Watch
        - Confined Space, if so:
            - Space(s) to be entered
        - Energized work
        - Purging
        - Excavating
3. On Form Changes - data is saved in Local Storage Draft
4. On Form Submit - data is saved in Local Storage Submitted
5. User can resubmit previously submitted requests