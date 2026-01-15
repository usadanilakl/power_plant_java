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