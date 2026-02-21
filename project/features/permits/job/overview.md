## Functionality

Job is an entity that contains all documentation for one specific task that is performed from its beginning to the end. The following data is attached to the job:
    - Daily Package (permits)
    - Comments
    - Status

## Job Lifecycle

# Start New Job
    - Work Request is submitted
    - Daily Package is generated (based on work request information)
    - Individual permits are generated based on daily package:
        - LOTOs
        - HotWorks
        - ConfinedSpaces
        - Safe Work
        - Energized Work
        - Excavation
        - Venting
    - Permits are released: signed and printed - work begins
    - Permits are closed at the end of shift:
        - requestor fills out package closure form:
            - is the job fully completed?
                - if yes - job closes
                - if no - job stays active and
                - show user their last work request for resubmission. 

