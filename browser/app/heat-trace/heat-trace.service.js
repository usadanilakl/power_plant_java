const heatTraceService = {
    getHeatTraces: (ids) => {
        return heatTrace.filter(ht => ids.includes(ht.id));
    },

    getHeatTracesByEquipmentIds: (equipmentIds) => {
        return heatTrace.filter(ht => ht.equipmentList.some(eqId => equipmentIds.includes(eqId)));
    },

    getExtendedHeatTrace: (equipmentId) => {
        return heatTrace.filter(ht => ht.possiblyRelatedEquipmentList.includes(equipmentId));
    }
    
}