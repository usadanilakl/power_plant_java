@echo off

:: Change to the parent directory
cd ..

:: Start the JAR file (replace "your_app.jar" with the actual name of your JAR file)
start javaw -jar power_plant_java-1.jar

:: Wait for a moment to allow the JAR to start
::timeout /t 5

:: Change back to the original directory
cd browser

:: Open the index.html file in the default browser
start index.html

:: Exit the batch file
exit