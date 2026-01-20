1. create new file type:
    - go to loto builder page: C:\Users\usada\my_projects\power_plant_java\frontend\src\app\features\loto-standard\refactored\loto-builder
    - click + in left menu
    - in the file form:
        - click on file type dropdown
        - click add new file type
        - in the value form:
            - add name "PID" 
            - add alias "PID"
            - click Save button
        - click close button on the file form.
    - click + in the left menu
    - verify new "PID" option is present in the file type dropdown. 

2. create new vendor (similar steps like new file type)

3. create file with new file type and vendor
    - go to loto builder page
    - click + in left menu
    - in the file form:
        - click on file type dropdown
        - click add new file type
        - in the value form:
            - add name "PID" 
            - add alias "PID"
            - click Save button
        - click on vendor dropdown
        - click on add new vendor
        - in the value form:
            - add name "Vendor 1" 
            - add alias "VND1"
        - add file to file field of the form: /home/dk-power/IdeaProjects/power_plant_java/automation-test/test-data/1.pdf or C:\Users\usada\my_projects\power_plant_java\automation-test\test-data
        - submit form
    - verify PID tab is selected, Vendor 1 dropdown present and file with name 1 is present inside the dropdown when toggled. 
    - click on file in the left menu and make sure it is displayed in the right side (file viewer).
4. create file type with existing file type and new vendor
5. create file with existing file type and existing vendor
6. modify vendor name and verify that:
    - menu changes - old vendor name is gone and new vendor name is added.
    - file is present in the vendor toggle
    - file successfully opens in file viewer (right section of loto builder)
6. full flow test: 
    - crete file with new file type "PID" and new Vendor "Vendor 1" (1.pdf) - verify file opens;
    - crete file with type "PID" and new Vendor "Vendor 2" (2.pdf) - verify file opens;
    - create file - "PID"/"Vendor 1"/3.pdf - verify file opens
    - create file - "PID"/"Vendor 1"/4.pdf - verify file opens
    - create file - "PID"/"Vendor 2"/5.pdf - verify file opens
    - create file - "PID"/"Vendor 2"/6.pdf - verify file opens
    - rename Vendor 1 to "Vendor 11" - make sure menu and viewer work.
7. delete all vendors but one:
    - open file form
    - select vendor to keep
    - one by one select the rest of the vendors and click delete button
    - in the Value form select vendor to keep as where to transfer items of vendor that is being deleted.
8. modify all existing in one section files one by one:
    - navigate to left file menu
    - find first toggle item
    - for each file of that section: 
        - open form
        - add file number
        - submit
    - refresh page
    - navigate to the same section
    - verify that each file in the section:
        - has the new file number
        - still opens