## Main

The app acts as an informational binder with visual navigation and reporting. 

## Information types

- Files
    - P&IDs
    - Manuals
    - Procedures
    - Schematics
    - Documents
    - Lists
    - Images
    - 3D models
- Physical Objects
    - whole plant
    - plant section (U1/U2/BOP/External)
    - System (Equipment connected together in a specific way)
    - Skid (Sub-system: eg - Boiler Feed Pump)
    - Equipment - smallest
    - Locations
- Permits/LOTO
- Fire Impairments
- Defects
- Logs
- SDS
- Live Data (EtaPro)
- People
- Scheduling

## Organization
All data is attached to a physical object(s)
All physical objects are arranged in 2 views:
    - 3D model (the whole plant)
    - 2D map (the whole plant) - simplified

## Navigation

- Using 2D/3D map, user zooms in on specific location to find any Physical Object. Found item contains any associated info:
    - Overview Information
    - Files
    - Permits
    - Logs
    - Defects (current/history)
    - Live Data
    - Current Scheduled Plans

- Using search, user finds a Physical Object and from the Object's dialog user can see all related info + view on 2D/3D map. 

## Current bugs

Equipment/LotoPoint mixup:
    - Originally Equipment was designed to hold both: coordinates on P&ID image and equipment data, the way it was implemented - if equipment is referenced multiple times in one document or in different documents - the duplicate was created. This created duplicates of the same equipment. 
    - LOTO Point was designed as independent entity but every LOTO point is an Equipment (valve, breaker and so on). So it created another duplication of the same data. 
    - to mitigate the issue, descission was made to use Equipment entity as "Connector" between LOTO points and File Reference - including coordinates
Category/Value Location vs WorkArea


## Missing

Category/Value System vs System entity that would bind equipment together in a flowpath.

2D/3D map - there is partially working schematics component that can be improved to full 2D map of the plant potentialy.

## Garbage

- Old thymeleaf/vanilla js and all Java Services associated with it are fully retired, but still there.
- Angular part also has fully refactored version of most its components while old are still there. 
