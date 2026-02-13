## JHA Structure: 
{
  "workRequestId": 42,
  "jobName": "...",
  "applicability": "...",
  "analysisBy": "...",
  "reviewedBy": "...",
  "approvedBy": "...",
  "date": "2026-02-11",
  "ppe": "...",
  "loto": "...",
  "confinedSpace": "...",
  "hazCom": "...",
  "handAndPowerTools": "...",
  "specialTools": "...",
  "jobSteps": [{ "sequence": 1, "description": "...", "hazard": "...", "safetyMeasures": "..." }],
  "submitterName": "DK",
  "submitterEmail": "dk@company.com",
  "submitterPhone": "555-1234",
  "submitterCompany": "DK",
  "timeSubmitted": "2026-02-11T03:40:54Z"
}

## Flow

From PWA user acesses JHA form: 
  - open work requests select work request, select action "Fill Out JHA"
  - open JHA - select one of the work requests in the left panel 
Fill out form
Submit form:
  - Before submission jha paper form image is created
    - PWA uses its own copy of existing component for paper forms (from frontend) [](../../../../frontend/src/app/features/form-designer-refactored/) to convert data filled out by user to image looking just like paper form. 
    - Data + image (as an attachment) are sent to SharePoint - use the same flow as current work request - PWA tries server, falls back to direc PA submission. Server tries using certificat access and falls back to direct PA access. 
    - power_plant_java applies the same deduplication strategy as work request (for Sync Server). 
    - submitted JHA gets associated with work request in 3 places: PWA local indexed DB, power_plant_java H2 DB, SharePoint List
    - Image JHA Attachment is attached to both, work request and JHA

## To Do
1. Plan conversion to printable form image: 
  - Copy the whole viewer component to PWA? 
  - Keep JSON file that holds paper forms objects or add to indexed db? 
  - implement to image here? or add to image functionality to main component on frontend and copy here? 
2. Plan JHA List creation steps on sharepoint
3. Plan JHA PA flow
4. Plan power_plant_java functionalities:
  - match structure (entity/repo/dto/mapper/services/controllers) - similar to work request
  - implement deduplication to/from sharepoint (the same as work request)
  - implement relationship - one work request holds one jha and all attachments
  - implement sync to sharepoint:
    - certificate flow (similar to work request)
    - pa flow (similar to work request)
  - implement Server Sync integration:
    - make sure it is part of sync
    - make sure it has deduplication logic - make sure deduplication handles JHA relationship - if one copy is deleted, JHA has to merge too.
  - make sure that current work request update from sharepoint includes pulling jhas and handle association on java side. 