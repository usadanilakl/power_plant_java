# Functionality:
User can manage (view, change) labeling/lockability status of each loto point.

The following fields will be used to track the status:
    - isLabeled - will be used to track labeling status
    - isLockable - will be used to track if locking mechanism is installed
    - isProcessed - will be set to true after loto point is fully processed
    - isVerified - will be used to verify fully processed point by another person
    - comment - will be used to note any corrections needed for the loto point. For example if loto point needs a new locking mechanism or needs to be relabeled. 
    - needsAttention - will be used to flag fully verified loto points for reprocessing (in conjunction with comment).

Acceptance Criteria: 
1. User sets new status (isLabeled, isLockable, isProcessed, isVerified, comment, needsAttention) - server database is updated, sync server is updated, local state is updated (forms, tables)
2. User adds comment to fully verified loto point - needsAttention is set to true. 

# Implementation

1. Add missing fields to Entity: isLabeled, isLockable, needsAttention. 
2. Add missing fields to Dto
3. Add new fields to mapper
4. Add missing fields to sync server Entity
5. Add missing fields to models: 
6. Add missing fileds to loto point mapper service
7. Add missing fields to loto point table. 
8. Add missing fields to loto point form. 
9. Add functionality to Print and Engrave dialog to set isLabeled status
10. Implement context menu Verified option functionality. 

1. In the table each loto point has 4 fields for status: 
    - isLabeled
    - isLockable
    - isVerified
    - comment
