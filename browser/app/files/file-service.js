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
    }, 

    getFileById: (fileId) => {
        const numericFileId = Number(fileId);
        if (isNaN(numericFileId)) {
            console.error('Invalid fileId provided:', fileId);
            return undefined;
        }
        return files.find(file => numericFileId === Number(file.id));
    },


    getFilesByNumberContaining: (number) => {
        return files.filter(file =>{
            return file.fileNumber.trim().toLowerCase().includes(number.trim().toLowerCase())
        });
    }

}