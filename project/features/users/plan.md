1. Study current implementation of User section of the app (SpringBoot ng-ui)
2. Study current implementation of schedule and contacts section (electron)
3. Add non-invasive persistence for schedule and contacts from electron:
    - display (current) functionality stays independent
    - match names from schedule/contact lists to DB
    - if springboot is running - persist any schedule/contact updates to the local DB (should this be attached to current user table??)
4. Add new functionality - contractor management:
    - establish flow to get users data from both SP and OnLocation - base connections are there, just need to set up exact endpoints for that information. 
    - perform periodic checks for contractor updates (new added, old removed)
    - allow manual checks:
        - scan for updates
        - generate report with missmatches
        - allow to accept changes from the report
5. Wire User section to PWA:
    - Access to schedule data (group restriction)
    - Access to contact data (group restriction)
    - Access to communication (group restriction)

6. Communication improvement. 
    - Current implementation has 2 options: email and in-app-messaging. Both are dependent on running hub-server. Need to find a way to make it more independent:
        - instead of using certificate on the server to send email have user send the email directly? this is not consistent across devices: User opens PWA, server is not available, they try to send email through the app - it fails (no server access), user is redirected to direct email app (which depends on user's device)
        - can we set up a secure way for PWA to use certificate directly? Place certificate on Supabase, if server is unavailable PWA uses certificate directly from supabase to interact with Email? Or even better - load certificate manually to the device using PWA?? seems like very secure way??
        - Duplicate messaging on supabase - if server goes down and user sends message from PWA - instead of failing, it saves it in supabase table. desktop clients, instead of reading it from server DB, read it from Supabase? when server gets back online - sync flow will fill in all gaps. 