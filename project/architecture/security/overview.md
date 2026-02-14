## SpringBoot Security is used.

## Security Sections

# Public
    - Submit Request to sharepoint
    - Get an update for specific sharepoint item
    - Send an update for specific sharepoint item

# Restricted
    - user authenticates via login page with SpringBoot Security
    - use cookies for token management
    - user can access restricted endpoints (their permit history, some logs and other...)

# Full Web Access
    - user authenticates via login page with SpringBoot Security
    - use cookies for token management
    - user needs a manual approval from machine in network to allow full access from outside of network:
        - User Sends request to server for full access
        - Admin page provides UI to monitor and control access (accessible only from within network)
        - Operator from in-network machine accesses the page and manually grants access. 
        - Secondary token is generated and sent to client, also client device ID is registered
        - Using restricted token, full access token and device id - user gains full web access. 
        - Set full access inactivity exparation - if client is inactive for an hour, revoke token. 
        - Max length of full access token is 24 hours. 

# Full Desktop Access
    - Desktop client auth: 
        - on springboot loading - get current windows user. 
        - if current user is in users DB and machine is in network - allow access
        - if machine is not in network - need web access. 
        - if user is not registered - register first.
        (Is it possible to keep desktop clients communication with server via http://local-ip:port instead of routing through public entry point??)


## Role Restrictions

# Admin

# Employee

# Contractor

TODO:
1. Set up User on backend - entity, repo, dto, mapper, services, controllers
2. Set up SpringBoot Security flow (refactor current)
3. Set up User and Auth in frontend - models, services, login page, profile page, users CRUD page, 
4. Define Security borders in Controllers on backend and frontend.