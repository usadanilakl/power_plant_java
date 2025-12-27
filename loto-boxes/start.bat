@echo off
cd C:\Users\usada\my_projects\power_plant_java\loto-boxes
::call ng build --configuration production --base-href "./"
cd dist\loto-boxes\browser
start python -m http.server 8000
timeout /t 2 /nobreak
start http://localhost:8000
pause