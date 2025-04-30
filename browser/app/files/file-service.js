const fileService = {
    getFilesByEquipmentId: (equipmentId) => {
        return files.filter(file => file.points.includes(equipmentId));
    },
}