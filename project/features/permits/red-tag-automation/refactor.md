## Current state
- Daily Permit Package component has ability to initiate permit building in red tag
- Backend has a way to process daily permit package step by step with ability to track step status and re-run failed steps
- Backend has ability to build LOTOs in the red tag app - this is fully functional feature from old version of this project: C:\Users\usada\my_projects\power_plant_java\browser\app\loto - the flow is: user selects points on interactive P&IDs into one list, when ready sends them to backend, backend initiate red tag automation. 

## Refactor plan
- implement "build loto in red tag" function in current LOTO feature. Each loto standard can be flipped into LOTO permit, then this LOTO permit can be built in red tag. 
    - Already Exists: backend can take loto points from front end and build them in the red tag (red tag needs to be open manually and set loto building page manually)
    - Needs to be implemented: 
        - automate loto building process just like the rest of the permits (open red-tag, login, open builder, fill out all fields, add points (add point is what currently exists)). 
        - add service method to loto permit page to send loto for processing to backend
- modify confined space permit
    - Current - one CS form
    - New - CS form has 2 versions now: Reclassified and Permit Required the following changes need to be implemented. 
        - Modify current form so it has 2 versions (not sure what is better - 2 fully separate forms, or one form with a conditional toggle - both forms are almost identical, the difference is some static text and colors)
        - Modify daily package to reflect which CS is attached to it (unless it is handled inside the CS itself - this is probably cleaner way)
        - Modify red tag automation - now red tag has 2 separate tabs for confined space instead of 1. when building CS it needs to build the right one. the SF form is also changed - now it has 2 separate check boxes - Reclassified CS and Permit Required CS - it needs to click the right one now. 
    
