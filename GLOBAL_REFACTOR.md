Goal:
1. Normal operations - centralized server works with desktop and web clients. 
2. If Server fails - desktop app on network with P2P sync
3. If Newtork fails desktop app runs everything locally and syncs when network or server comes back.

Vital functionalities:
1. each desktop app holds all file copies (P&IDs, drawints, procedures) for full offline capabilites - but they need to sync.
2. Computer interactions: excel read/write, desktop automation
3. External interactions: MS Sharepoint

Plan:
create NX nomorepo with: NestJS, Electron, Angular and shared libraries. Replace springboot server with NestJS. Use RxDb field based custom sync service that would handle both sync with server and p2p. 


Entity Refactor:
1. Enhance Enverse to keep set number of history items and delete history items beyond set limit. 
2. Clean up Base Entity:
    -
    -
3. Equipment, Highlihgt, LotoPoint, FileObject refactor:
    - Coordinates, OriginalSize and shape data to be transfered to Highlight entity
    - Equipment holds equipment specific data only. 
    - LOTO point extends Equipment Entity and adds loto point specific data.
    - Equipment/LOTO point can reference multiple Highlights. One Highlight can only reference one Equipment. 
    - One file holds multiple highlights, each highlight references one equipment. 
4. Set up RxDb with sync on client side:
    - Create client side DB service
    - Create RxDb sync service
    - Modify client Side entity services to work with RxDb instead of server.