1. Need a way to manage entry of new chemicals into the system
2. Need a way to remove existing chemicals from the system
3. Need a way to audit chemicals

SDS system structure:

1. Need new section in the app:
    - Springboot (desktop and hub) - new entity + UI + synchronization + sharepoint backup (similar to work request flow)
    - Electron (desktop) - overview (show newly added chemicals, unprocessed chemicals) and quick access to springboot UI
    - PWA - UI to add/remove/edit SDS items through the hub or independently from the hub directly on the sharepoint (work request flow)
2. Hard copy (Books):
    - Chemicals are not ordered in any specific way - just added to the end of the book and assigned index number, if book is full, new book is started. Each book also has index number.
    - If applicable, chemical can have multiple names/aliases
    - Index table is the one that is:
        - listing all entries in alphabetic order
        - containing "address" for each chemical - book index number, chemical index number


It is multi-user system, thus it needs to guide all users through the same steps for consistency:

- New SDS has arrived:
    - from PWA or Hub or Desktop, user clicks button to trigger the flow:
    - add names of chemical (can be multiple)
    - add location of the chemicals (can be multiple)
    - attach pdf file
    - save all data including who processed the data
    - At this point system will generate the following:
        - title sheet with:
            - all names of the chemical
            - all locations of the chemical
            - index number in the right upper corner
        - updated index sheet (with new chemical in it)
        - list of manual steps for the user to do:
            - Print the title sheet
            - Print the index sheets for all books
            - Print PDF file with the SDS data for the chemical
    - Confirmation step:
        - prompt user to confirm that all manual steps are done
        - prompt user to confirm that all data is correct (show overview of all steps)

- Inventory:
    - From PWA user selects SDS inventory
    - Select inventory by:
        - Location
        - Alphabetic chemical list
    - List of chemicals is rendered
    - User selects each item and:
        - confirms all data is correct (this should remove items from list)
        - does edits to data:
            - new data is saved
            - old data snapshot is saved (tracked in hub DB, not sharepoint)
            - audit data is saved - who, when, comments
            - item removed from audit list
