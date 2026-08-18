- Public access:
    - SDS link to ebinder (SDS section) (new)
    - JG Portal SDS inventory (SDS section) (new)
    - WR/JHA submission

- Public verified access (verify user is present in orientation list on SP):
    - Plant Map (Plant Section) (new)
    - Emergency information (new)
    - Contact information (new)
    - Link to orientation video (new)

- Authenticated:
    - rest of the sections
    - additional gate for hub dependent sections (hide when not available)
    - additional gate for roles (hide unreachable)


- Sections:
    - SDS
        - link to eBinder (Public)(new)
        - Add new (Plant)(current)
        - Audit (Plant)(current)
        - Full Inventory (Plant)(current)
    - Plant
        - Map (Public Verified)(new)
        - Emergency (Public Verified)(new)
        - Contacts & Information (Public Verified)(new)
    - Permits
        - WR
        - JHA
        - My Permits
        - Messages
        - Loto
        - Loto Standard
    - Maximo
        - WO (Plant)(current)
        - SR (Plant)(current)
        - PM (Plant)(current)
        - Parts (Plant)(current)
    - Personnel
        - Schedule (Plant)(current)
        - Contacts (Plant)(current)
        - Chat (Plant)(current)
        - Contractors (Plant)(Current in electron, need to move to hub)
    - Rounds (Plant)(current)
    - Qualification  (Plant - read only, Safety - full access)(current) - need to add "Safety" Role to backend and frontend.
        - People
        - Quals
        - Reports
    - Instrumentation (Instrumentation)(current)
    - Field List
        - Insulation Removal (Plant + Insulation)(current)
        - Insulation Installation (Plant + Insulation)(current)
        - Leaks (Plant + Insulation)(current)
        - Winterization (Plant + Insulation)(current)
        - Open Items (Plant + Insulation)(current)
    - Inventory
        - Scan (Plant)(current)
        - Add New Item (Plant)(current)
        - View Inventory (Plant)(current)

- New functions
    - Map - show the same Plant Map that Field Item Picker uses; add new work area types (safety showers, AED, Muster Points, Tornado Shelter) - render map on PWA page with type selector so user can click on type and see it on the map (mostly built, just need to piece together)
    - Plant Contacts and Emergency info - new simple page with some info for contractors
    - Contractors - electron does it already - gets contractors list from onlocation. What we need to do - either move it to hub and serve data to pwa, or have electron fetch it and save on the hub... i think there is already a button to save data, but seems like it is all confusing and not clean. need to come up with clean reliable set up so it is centralized on the hub, and also can work without hub (clients can reach directly to onlocation (curren), pwa can use stale data)


1. For un-authenticated users - they first land on the page explaining how to register or login. Also allow user to keep going without authentication (button). Also show an option for user to provide name, email and phone (at least one) without proper authentication, so we can verify against our orientation list (contractor setup that needs to be built)
2. Section combining plan - combine sections into sub-sections. While sections are combined (all current icons can stay). They just move to sub-section page (like current Field List - user clicks on "Field List", page with sub-section is shown). The right side "More" button should show all subsections (groupped by section) and user can move those shortcuts up and down (current setup but should support all sections and sub-sections for direct access).