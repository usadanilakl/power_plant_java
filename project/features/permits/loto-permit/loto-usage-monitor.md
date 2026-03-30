## Flow
WR submitted -> Job is generated -> permit package is created. Part of permit package is - LOTOs. 

Job should track associated LOTOs:
    When package is activated - all associated LOTOs attach to the Job -> attached lotos stay with the job until job is closed or until LOTO is manually detached from the job by operator. 

An overview table component is needed to render LOTO usage: 

Box Number|LOTO name (scope)|associated Jobs|Foremens(from jobs)

the table should help with 2 things: 
- Foremen to see what LOTOs to sign on to
- Operators to see if LOTO is no longer needed (no associated jobs)