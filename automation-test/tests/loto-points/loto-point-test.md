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

3. Create LotoPoint with counterpart:
    - Draw shape
    - input Tag Number that start with 01
    - verify counterpart form opens
    - fill out the rest of the fields
