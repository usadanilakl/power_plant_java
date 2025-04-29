const equipmentService = {

    createShapeFromEquipment(equipment) {
        // Parse the coordinates string
        const coordParts = equipment.coordinates.split(',');
        const coords = {};
        coordParts.forEach(part => {
            const [key, value] = part.split(':');
            coords[key] = parseInt(value, 10);
        });
    
        // Parse the original picture size
        const sizeParts = equipment.originalPictureSize.split(',');
        const originalSize = {};
        sizeParts.forEach(part => {
            const [key, value] = part.split(':');
            originalSize[key] = parseInt(value, 10);
        });
    
        // Create the shape object
        const shape = {
            type: 'rectangle',
            x: coords.startX,
            y: coords.startY,
            width: coords.endX - coords.startX,
            height: coords.endY - coords.startY,
            color: 'blue',
            isSelected: false,
            tagNumber: equipment.tagNumber,
            description: equipment.description,
            eqType: equipment.eqType,
            vendor: equipment.vendor,
            system: equipment.system
        };
    
        return shape;
    },

    getEquipment(ids){
        return equipment.filter(eq => ids.includes(eq.id));
    },

    getShapes(ids){
        console.log('Fetching shapes for IDs:', ids);
        const shpes = [];
        this.getEquipment(ids).forEach(eq => {
            shpes.push(this.createShapeFromEquipment(eq));
        });
        return shpes;
    }


}