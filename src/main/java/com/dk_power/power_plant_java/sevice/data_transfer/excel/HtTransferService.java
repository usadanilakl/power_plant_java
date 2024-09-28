package com.dk_power.power_plant_java.sevice.data_transfer.excel;

public interface HtTransferService {
    void connectHtWithIsoFiles();
    void connectHtWithPids();
    void connectInstrumentsWithPids();
    void combineCircuits();
    void combineBreakers();
}
