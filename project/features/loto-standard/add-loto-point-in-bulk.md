LOTO Builder improvements:
1.  Create Utility method - tag number detector - it takes a string and recognizes and returns full or partual tag number in it. 
2. Create LotoPoint bulk search method to LotoPoint Services - it takes a string, recognizes all tag numbers in it and returns all existing loto points matching tag number. 
3. Create LotoPoint Bulk Search report component - handles input for search and result report - shows search string, and results: exact match for full items found, full items with duplicates, partial tag results (if applicable) and items not found. 
4. Extend functionality - search by image. User uploads image, backend runs text recognition (exists), then finds tag numbers and performs bulk search
5. loto standard uses new LotoPoint Bulk Search component as one of the options to add loto points to it:
    - access to bulk add - button that calls dialog
    - dialog provides search by string or image
    - report result provides controls to add loto point results to loto point. 

list of loto point tag numbers for generating tag number detector utility function: 
[loto-point-excel](./loto_points_20260218_073904.xlsx)

loto standard components that allows bulk search:
    - [form](../../../frontend/src/app/features/loto-standard/refactored/rf-loto-standard-form/rf-loto-standard-form.component.ts)
    - [simple-form](../../../frontend/src/app/features/loto-standard/refactored/loto-builder/simple-loto-form/simple-loto-form.component.ts)