## Functionality

Work areas are phisical locations that are used for the following:
    1. Clarity - using the same language across all workers. Contractors are not familiar with plant as good as Employees, to help mitigate this gap, work areas will be used. Contractors can:
        - view map of the plant and find their work location
        - search by name
        - read description of each area with equipment list
    2. Track work load in each area - as safeworks are issued, monitor component will render all work performed in different formats: map, list, table. 
    3. Centralize constant hazards - work areas has constant hazards that require constant measures taken before work starts - confined space, LOTO, Flameable materials and so on. Constant hazards that are set once will help to avoid errors - when new safework is created for a work area, constant hazards will help operators not to miss anything. 

## Implementation

# Backend
    - Create full package: Entity, Dto, Repo, Mapper, Services, Controller
    - Entity should include:
        - Name
        - Description
        - ConstantHazards (hazards that are always present in the area)
        - ConstantLotos (Lock Outs that are always requered to work in the area)
        - AreaType (Confined Space, Electrical, Explosive Gas, Chemical)
# Frontend
    - Model, Services, Form Field (to be used by other entity forms), Form (for creating new Areas), Table.
    - Map - image with plant areas (interactive spots)

# Challenges

1. Form filed. WorkArea will be used by WR, SW, HW, CS possibly LOTO and LOTO point forms so it needs to be integrated as a form field, how to better do it? 
    - there is current implementation (/home/dk-power/IdeaProjects/power_plant_java/frontend/src/app/features/values), should WorkArea be set up similarly as a separate form field? or should the value form filed be reused (convert WorkArea to Value?)
2. Work Area Map:
    - Set image is used (plant outline)
    - User draws rect shapes to identify interactive spots on the image
    - Each shape represents one or more WorkAreas
    - List of all Work Areas are displayed in the left menu
    - In Dev mode: 
        - user can add/remove areas to list
        - user can modify each area
        - user can add/remove Areas to shape
        - modify each shape (size, position)
    - In Operator mode:
        - user can iteract with list of areas in the left menu - select them to set other form field (Safe Work for example)
        - User can interact with shapes on the image to find specific Work Area - then select it for other Entities
    - In Overview Mode: 
        - Map is displayed with overview details:
            - icons on the map - each shape shows how many SW/HW/CS are in the area (total of all WorkAreas that belong to the shape)
            - List with the same data per WorkArea
            - user can see more details when Shape is clicked, when area is clicked (who is working and their work scope)

    similar implementation - P&ID image is displayed, shapes are placed on it (imge/shape sizing and movements are managed by interactive image component: /home/dk-power/IdeaProjects/power_plant_java/frontend/src/app/shared/image/refactored/interactive-image ) each shape represents one loto point. (/home/dk-power/IdeaProjects/power_plant_java/frontend/src/app/features/loto-standard/refactored/loto-builder)
