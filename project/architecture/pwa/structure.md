
# PWA resides on github pages
# 2 acess types: Authenticated and Non-authenticated
    ## Any User
    - First use:
        - Save in indexed DB Name, Company, phone number, email
    - On Data submission (contact info attached with every submission request):
        - Save in indexed db with, get id and attach to outgoing data
        - try server (power_plant_java instance). Server's flow:    
            - tries certificate upload to SharePoint
            - if fails, tries Power Automate upload
            - if successfull: save data (with sharepoint id) in server's h2 db and let it sync with Sync Server
            - if sharepoint failed - save data (without sharepoint id) and let it sync.
        - try power automate
        - if any method worked, save draft into
        - send email (manual prompt with text and links)
    - On Data updates (if user needs to update submitted data)
        - From table, select item to edit, edit, submit - the same flow is followed (status changes to updated)
        - To revoke request - the same flow, different status
    - On Data updates (data was processed)
        - user gets an email
        - user can manually request status check (the same flow: try server -> try PA -> send email)

    ## Authenticated
    - Users reach to power_plant_java instance that runs on public server with authentication flow
    - If successfull, user gets access from PWA to power_plant_java web instance for:
        - tracking permit statuses
        - submitting updates
        - receiving updates

# Functionalities (PWA only)
    - Work Request [](../../features/permits/work-request/)
        - Submit
        - Change
        - Revoke
        - Resubmit
        - Check Status
    - Confined Space 
        - Check Status
    - Instrumentation Log
        - Submit
        - Change
        - Revoke
        - Resubmit
        - Check Status


# Implementation
