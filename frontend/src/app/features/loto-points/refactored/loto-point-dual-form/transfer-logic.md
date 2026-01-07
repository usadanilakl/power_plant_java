1. transfer tagNumber (text field) - if starts with 01 flip to 02, if start with 02 flip to 01
2. transfer unit, description and specificLocation fields (text fields) - if tag number starts with 01 then: 
    search for any instance of(U1, U 1 Unit1, Unit 1, u1, u 1, unit1, unit 1, UNIT1, UNIT 1) and swap 1 to 2.
3. isoPos/normPos/eqType/location fields (value-select) - trasfer as is - those Value items are shared
4. zeroEnergy transfer:
    -create new ZeroEnergy entity.
    -zeroEnergyTemplate (Value entity) - reuse as is
    -templateEquipmentIds: 
        for each id: 
            - find full Equipment entity, 
            - get first item from Set<LotoPoint> lotoPoints array 
            - find its counterpart for another unit
            - get first item from Set<Equipment> equipmentList
            - add its id to new zero energy object's templateEquipmentIds.