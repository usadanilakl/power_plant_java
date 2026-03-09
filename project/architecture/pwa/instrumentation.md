## Functionality
User opens instrumentation log page:
    - request is sent to server to get updated list
    - saves list locally in indexed db - clears old items, saves new
User selects item from left menu (searchable):
    - instrument tag number and description are populated in the form
    - date and time are auto populated
    - name autopopulated from the user data gathered at first interaction with PWA
    - user sets status, comment, attachments
    - submits to server -> server saves locally -> saves on SP. If server unavailabe PWA uses PA to save log on SP.
If item cannot be found user can submit a new instrument from PWA:
    - open new instrumenation form
    - fill out
    - submit

From JG Portal (power_plant_java) user can:
    - view instrumentation log
    - view instrumentation list
    - add new instrumentaion items (single or bulk)

Potential improvements:
    - more efficient management of instrumentation list - set up a flag on sharepoint that is set when new item is added (or just check number of items, update PWA local DB only if different between PWA and SP)