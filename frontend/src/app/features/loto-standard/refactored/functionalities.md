Loto Standard - an entity that binds loto points into one group for easy LOTO generation.
Loto Points have specific order for operator to follow.

Server Side entity: 
    private List<LotoPoint> lotoPoints = new ArrayList<>();
    private String description;

    (Methods to manage order)


UI: 
LotoStandardPage -> renders standards table and other managing tools
LotoStandardTable -> renders standards using (C:\Users\usada\my_projects\power_plant_java\frontend\src\app\shared\table\refactored)
LotoStandardForm -> renders standard details using: 
    to manage loto point add/remove/reorder - C:\Users\usada\my_projects\power_plant_java\frontend\src\app\features\loto-points\refactored\double-loto-point-table
    to view all related images from all loto points - C:\Users\usada\my_projects\power_plant_java\frontend\src\app\features\loto-points\refactored\loto-point-file-viewer

Usage: 
User opens LOTO Standard page sees table with all standards and table controls to add/delete/edit options
In left menu - toggle dropdown (same implementation like files/loto points) - standard entity will be extended to have system and other field for grouping. 
When form is opened User sees double table on the left is database loto points on the right is ordered loto points that standard includes. 
User can reorder/add/remove/edit loto points - full loto  point table functionality (included in double table component.)
