package com.dk_power.power_plant_java.sevice.data_transfer.excel;

public interface ElectricalPanelTransferService {
    void createElectricalPanelFileObjectsFromExcelList();
    void connectPanelsFilesWithPanelObjects();
}
