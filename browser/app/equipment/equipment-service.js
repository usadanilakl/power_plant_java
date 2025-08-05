const equipmentService = {

    createShapeFromEquipment(equipment) {
        // Clean up and parse the coordinates string
        const cleanCoordinates = equipment.coordinates.replace(/[^a-zA-Z0-9,.:]/g, '').replace(/,\s*$/, '');

        const coordParts = cleanCoordinates.split(',');
        const coords = {};
        coordParts.forEach(part => {
            const [key, value] = part.split(':');
            coords[key.trim()] = parseInt(value.trim(), 10);
        });
    
        // Clean up and parse the original picture size
        const cleanSize = equipment.originalPictureSize.replace(/["']/g, '').trim().replace(/,\s*$/, '');
        const sizeParts = cleanSize.split(',');
        const originalSize = {};
        sizeParts.forEach(part => {
            const [key, value] = part.split(':');
            originalSize[key.trim()] = parseInt(value.trim(), 10);
        });

        // const lotoPoints = equipment.lotoPoints && equipment.lotoPoints.length > 0? equipment.lotoPoints.map(lp => lotoPointService.getLotoPoint(lp)) : null;
        const lotoPoints = equipment.lotoPoints && equipment.lotoPoints.length > 0? equipment.lotoPoints : null;
        const files = equipment.files && equipment.files.length > 0? fileService.getFilesByIds(equipment.files) : null;
    
        // Create the shape object
        const shape = {
            id:equipment.id,
            type: 'rectangle',
            x: coords.startX || 0,
            y: coords.startY || 0,
            width: (coords.endX || 0) - (coords.startX || 0),
            height: (coords.endY || 0) - (coords.startY || 0),
            color: 'blue',
            isSelected: false,
            tagNumber: equipment.tagNumber,
            description: equipment.description,
            eqType: equipment.eqType,
            vendor: equipment.vendor,
            system: equipment.system,
            location: equipment.location,
            originalWidth: originalSize.width || 0,
            originalHeight: originalSize.height || 0,
            lotoPoints: lotoPoints,
            files: files,
            relatedEquipment: equipment.relatedEquipment,
        };
    
        return shape;
    },

    getEquipment(ids){
        return equipment.filter(eq => ids.includes(eq.id));
    },

    getShapes(ids){
        const shpes = [];
        const equipment = this.getEquipment(ids);
        equipment.forEach(eq => {
            shpes.push(this.createShapeFromEquipment(eq));
        });
        return shpes;
    },


}