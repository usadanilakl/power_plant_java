Enhance current guide to: 
1. Step dialog - shows current guide (already implemented) and shows message/instruction with interactive buttons.
2. Conditional highlights and instructions - instead of highlighting all related items at once - use step dialog to determin exact goal that user have and highlight elements that are direcly related to atchieve next needed step. 

Example:
Guide - Full LOTO Builder.
1. Guide detects home page, highlights builder card and builder menu item (as it does now) and also adds message to step dialog "Navigate To LOTO Builder" (new). 
2. Guide detects loto builder page - step dialog displays message "What would you like to do: Upload File, Add LOTO Point to existing file, Add LOTO Point to new file, Add LOTO point to existing LOTO, Add LOTO point to new LOTO.
3. User selects one option, guide shows next step depending on selected option. 
4. Add LOTO Point to new LOTO was selected, guide takes user through steps:
    - click "Build LOTO" button (button is flagged)
    - click "Create New Standard" button (button is flagged)
    - input name, description and click "Create & Add" (flagg all 3)
    - hint: 
        - you can drag LOTO Standards Editor dialog
        - you can resize LOTO Standards Editor dialog
        - you can edit more than 1 LOTO at once, click "Add New" button
        - if more than 1 LOTOs are added to Standards Editor - use errows to switch between LOTOs
    - select existing file or add new.
    - select existing shape or draw new
    - draw shape
    - fill out loto point form
    - right click on new shape
    - select add to LOTO option.