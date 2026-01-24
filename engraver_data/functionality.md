1. User Selects LOTO Points in LOTO Point table
2. Clicks "Engrave" in bulk controls section
3. Spring Boot creates CSV file
4. Spring Boot opens LightBurn
5. Loads CSV to saved Template
6. User processes it in LightBurn

This functionality should be similar to how it is in printing functionality with Brady. 

Related files: 
1. C:\Users\usada\my_projects\power_plant_java\engraver_data
2. C:\Users\usada\my_projects\power_plant_java\frontend\src\app\shared\brady-printer-manager
3. C:\Users\usada\my_projects\power_plant_java\frontend\src\app\features\loto-points\refactored\rf-loto-point-table

Some conserns: 
Engraver can only process 4 tags at once. How to set up easy flow so user can select any amount of loto points and process them all in baches of 4