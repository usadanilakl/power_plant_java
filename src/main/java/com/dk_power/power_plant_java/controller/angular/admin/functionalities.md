1. Restore File Integrity:
    -file link is built using this formula: baseLink+"/"+extension+"/"+fileType.getName()+"/"+vendor.getName()+"/"+fileNumber+"."+extension - need to create reverse mechanism to iterate through folders with files and check if corresponding files exist

2. Separate Equipment and LotoPoints so each equipment only has 1 loto point
    -use current logic:
        equipmentRefactorService.splitAllEquipmentWithMultipleLotoPoints();

3. Assign Location, System, EqType, Vendor from Equipment to LotoPoint
    -use current logic:
        equipmentRefactorService.assignEquipmentLocationAndTypeToLotoPoints();

4. Associate LotoPoint with its counterpart (U1/U2):
    -create method that finds all loto points with tag number starting with 01 ->
    flip it to 02 -> find loto point(s) with this tag number -> make sure no duplicates present on both sides
    (tag starting with 01 and tag starting with 02) set counterpartId for both loto points - if not found, or multiple loto poins found do nothing.

Create missing methods in respective services
Create controller component to trigger them
Create UI component to trigger these actions (frontend).