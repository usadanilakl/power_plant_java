1. Like Equipment - upload file if doesn't exist, draw shape (/home/dk-power/IdeaProjects/power_plant_java/automation-test/tests/equipment/equipment.spec.ts). 
2. when loto form popup opens:
    - click "New" tab
    - input 00-test001 into Tag Number field
    - fill out the rest of the form
    - fill out new zero energy: 
        - add new zero energy pharase:
            - click on dropdown
            - click add new zero...
            - fill out phrase dialog: 
                - create phrase name
                - create phrase[action] + placeholder + [action] + placeholder (Open 01-vcnd123 drain and verify 01-lvl123 level guage is empty)
        - add equipment:
            - click + Add Equipment button
            - in the dialog:
                - select file in the menu (open dropdown and click file)
                - create a new shape (find spot with no shapes right click and drag)
                - click save and select button
                - if zero-energy-loto-point-form is shown - fill it out: tag number, equipment, description, isolated position, normal position and location.
                -click create loto point
    - submit form

Form elements: /home/dk-power/IdeaProjects/power_plant_java/automation-test/tests/loto-points/elements

3. Create dual LOTO points with counterparts and zero energy references: (IMPLEMENTED - test 3 in loto-point-from-shape.spec.ts)
    Modified flow:
    1. Upload 2 files (unless already present): equipment-test-file (U1) and equipment-test-file-u2 (U2)
    2. Create first pair of LOTO points (01-dualA/02-dualA) using dual form:
       - Draw shape on U1 file for primary
       - Fill basic fields (tag, description, dropdowns)
       - Add equipment to counterpart on U2 file
       - Skip zero energy for this pair
       - Submit both units
    3. Create second pair of LOTO points (01-dualB/02-dualB) using dual form:
       - Draw shape on U1 file for primary (different area)
       - Fill basic fields
       - Add zero energy using existing phrase
       - Reference first pair LOTO points for zero energy equipment
       - Add equipment to counterpart on U2 file
       - Add zero energy equipment for counterpart (reference first counterpart)
       - Submit both units
    4. Verify all 4 LOTO points were created successfully
