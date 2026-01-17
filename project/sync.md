1. frontend: C:\Users\usada\my_projects\power_plant_java\frontend
2. backend: C:\Users\usada\my_projects\power_plant_java\src
3. sync-server:C:\Users\usada\my_projects\sync-server

Flow:
frontend change -> backend -> local db -> sync server -> SSE broadcast to other backend instances -> SSE broadcast to frontend

Field Based Entity Sync: 
Changes to local h2 entities are detected and submitted to sync server -> server saves changes locally and broadcasts it to clients -> saved changes are clerared out periodically. 

File Sync:
Files saved locally in the backend app -> files are submitted to sync-server per FileObject item -> changed broadcasted to other clients -> clients process them to update local file system. 