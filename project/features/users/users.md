## Groups
User can belong to multiple groups.
- Plant
- NAES
- JPower
- Contractor

## Access
All app intercations are through:
1. On-Network desktop
2. Direct Web
3. PWA

Each group has it's own permission level (access restriction).

## User Management
- Direct UI through the app under Admin section
- On-boarding flow (currently going through PA to SP and OnLocation):
    - can get users directly from SP or OnLocation
    - potentially can re-work the on-boarding flow directly through the app. 

## User Lists and Sources:
    - Server Hub DB is the source of truth
    - OnLocation DB (through API) - potentially incoming source and also source of users that are on-site
    - SP Schedule - people on shift and people on-call - names will need to be matched to app DB (SP list has different names - not full/aliases)
    - SP contact list - plant people and their contacts + emergency contact - some matching might also be needed


