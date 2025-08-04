const lotoPointService = {


    getLotoPoints(ids){
        return lotoPoints.filter(lp => ids.includes(lp.id));
    },

    getLotoPoint(id){
        return lotoPoints.filter(lp => lp.id === id);
    },

    getAssociatedEquipment(ids){
        const lotoPoints = this.getLotoPoints(ids);
        const equipmentIds = [...new Set(lotoPoints.flatMap(lp => lp.equipmentList))];
        return equipmentService.getEquipment(equipmentIds);
    },

    getAssociatedFiles(ids){
        const equipment = this.getAssociatedEquipment(ids);
        const fileIds = [...new Set(equipment.flatMap(eq => eq.files))];
        return fileService.getFilesByEquipmentIds(fileIds);

    }


}