1. create new file type:
    - go to loto builder page
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
        - add file to file field of the form: /home/dk-power/IdeaProjects/power_plant_java/automation-test/test-data/1.pdf
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
    - crete file with new file type "PID" and new Vendor "Vendor 1" (1.pdf);
    - crete file with type "PID" and new Vendor "Vendor 2" (2.pdf);
    - create file - "PID"/"Vendor 1"/3.pdf
    - create file - "PID"/"Vendor 1"/4.pdf
    - create file - "PID"/"Vendor 2"/5.pdf
    - create file - "PID"/"Vendor 2"/6.pdf
    - rename Vendor 1 to "Vendor 11" - make sure menu and viewer work.