## Idea
Power plant is a complex entity that consists of smaller and simplier components and categories:

Power Plant
    - Unit 1
        - System 1
            - Equipment 1
            - Equipment 2
        - System 2
    - Unit 2
    - BOP

For best user experience it is best if smallest element of the Power Plant (Equipment) is interconnected with specific relationship. This will allow for the following functionalities:
    - Visualization:
        - 3D Plant
        - Dynamic P&IDs (build full systems or separate components based on relationships between Equipment that is part of the system or component)
    - Building LOTO:
        - use Visualization tools to show equipment and their relationships involved in LOTO
        - help user to make sure that all possible isolations are included to the LOTO - use equipment relationship to help user identify all points that potentially needed for LOTO
    - Troubleshooting
        - use relationships between equipment to analyze connections with other equipment to suggest cause of symptoms (low pressure on pump discharge - analyze all isolation valves, drains, relief valves, transmitters etc)
    - Training
        - use Visualization tools to explain system functionalities:
            - process flow
            - process parameters (temps/pressures)
            - electrical interconnections
        - simulations:
            - show affect of one equipment changing state using visualization tool
            - let user to change state of equipment and reflect changes in the visualization renderer

## Implementation

Existing:
    - Equipment/LotoPoint entities that represent popwer plant components: pipes, valves, instruments, heat trace, breakers.
    - 3D Plant modeling (partual implementation)

Planned:
    - Admin tool that allows admin-users to establish relationships between equipment using current P&ID rendering tools:
        - user opens P&ID with already proccessed equipment
        - user can draw new equipmnet (implemented)
        - user can edit existing equipment (implemented)
        - user can establish relationship between equipment (new)
    - 2D Visualization
    - 3D Power Plant Visualization
    - 2D animation:
        - equipment changes state
        - equipment reacts to other equipment changing state
    - 3D animation - similar to 2D animation

    NOTE: 
        - relationship structure need to allow:
            - 3D visualization
            - 2D visualization
            - animation (states, parameters)
            - behavior (react to other equipment state change)

## Challenges and Gaps:

- Equipment:
    - Originally Equipment was designed to hold equipment detailes and connection to files (coordinates on P&ID image)
    - It created an issue - if equipment appears on multiple files - it would generate equipment duplicates
    - Resolution:
        - let LotoPoint act as equipment (no duplicates)
        - let equipment entity act as connector between LotoPoint and FileObject

- Architecture Gaps and Inconsistencies:
    - Entity naming is confusing now after patches applied above
    - Equipment (LotoPoint) is the only building block for the power plant, feels like there is gotta be different size elements:
        - equipment builds skids (blocks)
        - skids build system
        - systems build plant
        examples: breakers build panels,panels and buses build electrical system; Boiler Feed Pump consists of pipes, valves, fans, heaters, breakers, instruments; multiple pumps build pump-skid; Pump skid with other equipment builds system.
    - Systems overlap between each other - it is not reflected currently in the entity structure