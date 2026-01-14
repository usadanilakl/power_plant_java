LOTO Builder Guided Form

Idea - user calls guided form dialog. Forms offers available actions (build loto standard, modify loto standard, add loto point, modify loto point, add file, modify file). Depending on selected action the next step with options and hints is shown. Everly little step will be taken at one time with plenty of explanations and clarifications - like a conversation. For example if build loto standard is selected the following flow is triggered: 
1. How would you like to name LOTO Standard? (the input field is shown with some hints, explanations and convensions). Add an option to "peek" at how other loto standards are named. When next is clicked, the name is saved in memory (or local storage) and move to next step.
2. the same process for description.
3. Ask if they would like to build a counterpart LOTO in parallel - explain what it is why it is beneficial (for consistancy) and why it is easier to do at once.
3. Time to add loto points! How would you like to search for loto points? By file table, by file menu, by loto point table, by loto point menu? if not sure then provide what you know: location(dropdow)? system(dropdown)? eqType(dropdown)? tagNumber(partial or full), unit - depending on selection show either file table/toggle-menu or loto point table/toggle-menu. if not sure was selcted and data provided - loto point viewer dialog where loto point table with preset query (with data inputed by user) is displayed on the left and file viewer is on the right where file updates when row in table is clicked; instruct user to select one or multiple loto points (store them in local storage); in parallel keep helper options visible in case user would want to create a new loto point or add new file - guide through that process then come back to building loto from where user left off. 


Structure:
{
    lotoStandardName: "Name",
    lotoStandardDescription: "Description",
    lotoPoints: [
        {
            standardPointName: "First LOTO Point Name",
            standardPointDescription: "First LOTO Point Description",
            standardPointIsoPos: ValueDto,
            standardPointNormPos: ValueDto,
            standardPointZeroEnergyPharase: ValueDto,
            standardPointZeroEnergyReferencePoint: LotoPoint,
            standardPointShapeAssociation: EquipmentDto
        },
        ...
    ]
}

couple implementation notes: 
1. for ValueDto fields - use value-select component - crud is already implemented: /home/dk-power/IdeaProjects/power_plant_java/frontend/src/app/features/values
2. for tag number - i would like user to be able to utilize tag number generator along side with manual input: /home/dk-power/IdeaProjects/power_plant_java/frontend/src/app/features/tag-number/tag-number-generator
3. for loto point description i would like user to be able to use /home/dk-power/IdeaProjects/power_plant_java/frontend/src/app/features/tag-number/naming-convention along side with manual input.
4. zero energy field needs 2 inputs phrase with place holders (ValueDto) and loto points that will be placed into placeholders. See: /home/dk-power/IdeaProjects/power_plant_java/frontend/src/app/shared/reactive-form/refactored/input-fields/zero-energy-phrase-builder - not necessarely need to reuse this component but logic should stay - if needed - create new component that fits into guided flow. 
5. equipment picker for zero energy and P&ID connection steps the same- refernce this: /home/dk-power/IdeaProjects/power_plant_java/frontend/src/app/shared/reactive-form/refactored/input-fields/equipment-unified-dialog - reuse if fits the guided flow, or create specific component with similar logic but fits the flow. 

And then continue with API connections. 