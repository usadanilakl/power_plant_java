## Buisness Logic:
1. Submission
    - Access PWA
    - Fill Out Form
    - Submit
2. JHA Attachment
    - Access PWA
    - Fill Out Form
    - Submit
3. Updating
    - Access PWA WR table
    - Select action
    - Submit
4. Processing
    - Open work Request
    - Review work request
    - Review JHA
    - Request more info (if needed)
    - Generate Permits
    - Update WR/JHA Status
    - Notify Submitter
5. Notifying

## Processing Logic
1. Submission
    - PWA sends http request
        - if server availble to server
        - if server unavailable to PA flow
        - if both failed - manual email with preset data
    - If server received from PWA:
        - perform deduplication
        - it saves it locally
        - syncs to clients
        - sends to sharepoint: 
            - if certificate flow available - uses it
            - if certificate auth fails - uses PA flow
            - if sharepoint submission fails - retries later
    - If sharepoint received directly from PWA:
        - server polls updates
        - deduplicates
        - saves
        - syncs
    - If WR/JHA were submitted by email:
        - link is provided to process it through server
        - if it doesn't work - process manually
2. JHA flow is the same with one additional step: attach it to existing WR.
3. Updating follows the same flow as submission.
4. WR Table and Permit Monitor are providing way to view/sort/search WR
    - Both Table item and Permit Monitor WR item on click open WR Action Popup:
        - Generate permits []()
        - Request more details 
        - Attach to existing Job
        - Cancel
            - Update Local H2
            - Update Sharepoint (use existing service [](../../../../src/main/java/com/dk_power/power_plant_java/sevice/sharepoint/SharepointAccessService.java) )