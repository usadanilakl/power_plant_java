## Description

Desktop Clients and Server will have access to SharePoint using Certificate with permissions OR PowerAutomate as fallback

Data to be synced: 
    - Users
    - Work Requests
    - JHA
    - Safe Works
    - Confined Spaces:
        - Permits
        - Air Monitoring
    - Hot Works

The main idea is that SharePoint can be used as a backup for the app - even if app goes down, main permit operations can be done via SharePoint UI (Lists) but at the same time the app needs to stay internet independent, to achieve this the following priorities needs to be followed: 
    1. Local desktop DB gets updated first and gets first priority
    2. Sharepoint is updated right after local DB
