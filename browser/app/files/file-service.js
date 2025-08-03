const fileService = {
    getFilesByEquipmentId: (equipmentId) => {
        return files.filter(file => file.points.includes(equipmentId));
    },

    getFilesByEquipmentIds: (equipmentIds) => {
        return files.filter(file => 
            file.points.some(point => equipmentIds.includes(point))
        );
    },

    getFilesByIds: (fileIds) => {
        return files.filter(file => fileIds.includes(file.id));
    }

}