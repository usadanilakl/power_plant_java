const heatTraceService = {
    getHeatTraces: (ids) => {
        return heatTraces.filter(ht => ids.includes(ht.id));
    },

    getHeatTracesByEquipmentIds: (equipmentIds) => {
        return heatTrace.filter(ht => ht.equipmentList.some(eqId => equipmentIds.includes(eqId)));
    }
}