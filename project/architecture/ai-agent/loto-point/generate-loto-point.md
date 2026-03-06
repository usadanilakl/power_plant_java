On app startup there is a script that runs to teach AI naming patterns for LOTO point descriptions and tag numbers, i think we should add a few more items to that collections: 
- equipment type based on tag number
- existing equipment types (Value entity)
- system based on tagnumber
- existing systems (Value entity)
- locations from specific location colunn of LOTO point table
- locations from (Value entity)
- normal and isolated positions (Value entity)

when creating loto point - Gemini analyzes initial prompt to see if it has, description, location and tag number, also isoPos, normPos - if not all present it asks follow up question. From description location and tagnumber it generates: unit, location, specific location, iso pos, nor pos. 

app generates loto point based on gemini result - user can correct each field. 

then i want to set up AI guided zero energy creation and file connection:

- Zero Energy:
    - zero energy consists of phrase template (Value entity) and LOTO point that takes place in the template placeholders
    - user provides zero energy texts: open drain 01-VCND337 and verify not flow. 
    - Gemini searches zero energy phrases that match the pattern: One drain open (Value item name field)
    - Gemini searches loto point matching loto point tag number from the prompt
    - if loto point or phrase wasn't found - it prompts user to create new Phrase or new LOTO point to complete zero energy field. 

- file connection
    - ask user what file does this loto point belongs to
    - search for the file using users response
    - if found, prompt user to draw shape on it
    - connect create loto point with the loto point that is being created.

- Sometimes user needs to create new Value items (location, system, eqType, isoPos, normPos)

this is pretty much what wizzard guide does - AI guided approach should be fully conversational: 
    - Create loto point .....
    - Here is what i generated, check and we can move on to connecting loto point to file. when you are ready, let me know what file it belongs to. 
    - it belongs to P&ID HP Drum
    - here is what i found, you can select one, search manually or upload new file
        - select one - continue to drawing shape
        - search manually - opens a popup that uses existing file picker component (file menu with preview section), lets user to select file - continue to drawing shape
        - upload new file - walks user through AI guided file upload flow - continues to drawing shape
    - selected file opens in popup dialog, similar that is used in wizard guide (file menu on the left, preview on the right where user can draw shape) drawn shape and connect it with the new loto point. 
    - how should zero energy be checked, make sure to provide tag number if applicable. 
    - verify drain 01-vcnd377 is open and no pressure present. 
    - here is what i found: 
        - phrase
        - loto point
        if eather one is missing - walk user through creating one. 
