## Functionality
For maximum information accessability at all times the following data presistance is provided:
1. Desktop Client local H2 DB
2. Hub Server local H2 DB
3. Sharepoint Lists and Email

To keep information up to date in all places, the following synchronization is implemented:
1. Normal Flow - Hub is online, Sharepoint is accessible:
    - Hub polls data from sharepoint
    - Hub saves missing items from the Sharepoint in Local H2 DB
    - Hub uploads items that are present locally but not present in the Sharepoint.
    - Hub synchronizes all items across desktop clients.

2. Hub Offline flow:
    - Each Client polls from and synchronizes to the Sharepoint
    - When hub comes online: 
        - clients stop individual sharepoint sync
        - hub deduplicates all locally saved items from sharepoint and synchronizes it across all clients, making sure that relationships are not lost: 
            - attachments are linked with entities
            - entity relationships are fully restored (for example WR with JHA)

## Implementation Specifics

# To avoid overloading sharepoint interactions when the Sync Hub is offline on each client:
    - indicate that Hub Is Offline
    - on pages that render info backed by sharepoint display message "Data might be outdated, sync with Sharepoint"
    - user manually confirms sync if needed
    - message reappears when another poll is due.
    - when sync is requested - only data related to the page it is requested from is synchronized (not all sharepoint tables)

    !This should reduce unnecessary sharepoint traffic and reduce duplicate generation. 

# To improve user experience
    - for each page that renders sharepoint backed data:
        - display last sharepoint sync time
        - provide manual resync button (only synchronized related data)