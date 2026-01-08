1. form is split into 3 sections (tabs)
2. General Info:
    - Name
    - Description
    - Groups
3. LOTO Points
    - dual loto point table is displayed - left table shows all points in db, right shows points in selected standard
    - right table has reorder enabled - when reorder is detected - change is registered on server side
    - on double click in left table - point is added to standard - register this change on server side
    - on double click in right table - point is removed from standard - register this change on server side
4. Images
    - displays carousel of all related images
    - display large image with loto points from standard


Plan
1. Add signals to double-loto-point-table.service.ts to emit reorder/add/remove events that are handled in /home/dk-power/IdeaProjects/power_plant_java/frontend/src/app/features/loto-points/refactored/double-loto-point-table/destination-loto-point-table
2. Add methods to rf-loto-standard-form.component.ts to react to reorder/add/remove events and convey it to server:/home/dk-power/IdeaProjects/power_plant_java/src/main/java/com/dk_power/power_plant_java/controller/angular/loto/NgLotoStandardController.java
3. Use/Modify /home/dk-power/IdeaProjects/power_plant_java/frontend/src/app/features/loto-standard/refactored/services/rf-loto-standard-api.service.ts has method to perform reorder/add/remove operations
4. Use/Modify existing or create necessary controller methods:/home/dk-power/IdeaProjects/power_plant_java/src/main/java/com/dk_power/power_plant_java/controller/angular/loto/NgLotoStandardController.java
5. Use/Modify existing or create necessary service methods:/home/dk-power/IdeaProjects/power_plant_java/src/main/java/com/dk_power/power_plant_java/sevice/angular/loto/NgLotoStandardService.java
6. Use/Modify existing or create necessary entity methods:/home/dk-power/IdeaProjects/power_plant_java/src/main/java/com/dk_power/power_plant_java/entities/loto/LotoStandard.java
7. Verfiy frontend models have necessary structure to render table in proper order received from server (/home/dk-power/IdeaProjects/power_plant_java/frontend/src/app/models/loto/loto-standard.model.ts and /home/dk-power/IdeaProjects/power_plant_java/frontend/src/app/models/loto/loto-standard-id.model.ts)
8. Verfy standard forms render loto point list in correct order: 
    - /home/dk-power/IdeaProjects/power_plant_java/frontend/src/app/features/loto-standard/refactored/rf-loto-standard-form
    - /home/dk-power/IdeaProjects/power_plant_java/frontend/src/app/features/loto-standard/refactored/loto-builder/simple-loto-form
9. Verify standard form submit doesn't accidentally override loto point order (should loto point list be removed from form submission since they are handled separately?)


Leftovers:
1. Add reorder functionality to: /home/dk-power/IdeaProjects/power_plant_java/frontend/src/app/features/loto-standard/refactored/loto-builder/simple-loto-form