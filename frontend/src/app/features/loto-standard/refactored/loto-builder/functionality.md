Usage: 
User opens loto builder - it is full screen window split into 2 sections: left (menu), right(image) - no main header - a form style - user will close at the end or submit.

left menu contains 2 tabs: files and loto points and a toggle switch for mode - table or toggle-menu. mode selects format and tags select content.

right side displays current file. At the bottom of the screen is a toolbar with buttons to see different menus and functionalities.

left/right section devider is resizble.

upper right corner - info window for loto point.

User interactions:
1. User searches for a file or loto point
2. User selects file or loto point - on select respective file opens (if loto point was selected then it gets highlighted on the opened file) and all equipment of that file renders.
3. On existing shape left click it displays related loto point information in the info-window
4. on double click clicked shape it unlocks shape editing - resize/relocate (updates server too).
5. on shape right click - context menu opens - it will have loto point edit option - calls loto point form - if clicked shape didn't have loto point then an empty form opens with a button "select existing" if clicked - loto point table opens - user will have to select loto point to associate it with selected shape on the image.
6. on right click and drag (outside of shapes - on image) a new shape is drawn and at the end of draw - shape is converted to equipment and saved on server. then loto point form opens where user can fill out a new loto point information or associate existing.
7. User can call "show loto points" menu where a loto point table is displaying all loto points that are in the current file - loto point table has full functionality of loto point table - row/cell mode, context menu, loto point form to edit, clipboard, bulk-edit.
8. User can select loto-building-mode where one or multiple loto standards can be selected (existing or new)
9. User can add loto points to: any of the lotos that were selected for edit.
    -create simple-loto-form container that shows loto standard data - name, description, loto points (as list). - text fields are editable from the from, loto points are added externaly
    -create carousel component that renders simple loto-forms and have a way to scroll through them. Render this as floating window.
    -items from loto builder component can be added to the simple form. on submit froms disapear from list of edited lotos.

Structure:
1. Main window component:
    -handles structure, resizing.
    -renders: left, right, loto-standards-popup, loto point info window.
2. left section:
    - fetches files and loto-point data from server (service).
    - renders: file-toggle-menu, file-table, loto-point-toggle-menu, loto-point-table
    - handles table/menu mode, file/loto-point views
3. right section:
    - renders: interactive image and shapes, toolbar
    - handles: shape crud, lotopoint curd (via form popup), loto point info display.
4. loto-standard-popup:
    - fetches all existing loto standards
    - handles loto-standard crud
    - renders loto-standard detail in carousel view (one standard per slide).
5. loto-point-info
    - renders loto point data

Flow:
1. User draws shape
2. Save Equipment with coordinates (no loto point yet)
3. Open loto point form with options:
   - "Create new loto point" → creates & associates
   - "Select existing" → opens table → associates
4. On save, update Equipment.lotoPointId

Cases:
What if user draws shape but cancels loto point form? → Delete the equipment/shape


Ready components to reuse: 
1. C:\Users\usada\my_projects\power_plant_java\frontend\src\app\shared\image\refactored\interactive-image
2. C:\Users\usada\my_projects\power_plant_java\frontend\src\app\features\loto-points\refactored\rf-loto-point-left-menu
3. C:\Users\usada\my_projects\power_plant_java\frontend\src\app\features\files\refactored\rf-file-left-menu
4. C:\Users\usada\my_projects\power_plant_java\frontend\src\app\features\files\refactored\rf-file-editor.component.ts
5. C:\Users\usada\my_projects\power_plant_java\frontend\src\app\features\loto-points\refactored\rf-loto-point-table