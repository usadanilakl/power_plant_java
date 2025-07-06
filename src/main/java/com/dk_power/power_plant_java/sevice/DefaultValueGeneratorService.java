package com.dk_power.power_plant_java.sevice;

import com.dk_power.power_plant_java.sevice.angular.NgValueService;
import jakarta.persistence.GeneratedValue;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class DefaultValueGeneratorService {
    private final NgValueService ngValueService;

    public void generateAllValues(){

    }

private void generateSystems() {
    ngValueService.createValue("System", "Service Water System", "SWS");
    ngValueService.createValue("System", "Demin Water System", "DWS");
    ngValueService.createValue("System", "Demin Water Treatment System", "DWT");
    ngValueService.createValue("System", "Condensate System", "CND");
    ngValueService.createValue("System", "Feed Water System", "BFW");
    ngValueService.createValue("System", "LP Steam System", "LPS");
    ngValueService.createValue("System", "IP Steam System", "IPS");
    ngValueService.createValue("System", "HP Steam System", "HPS");
    ngValueService.createValue("System", "CT System", "CTP");
    ngValueService.createValue("System", "ST System", "STP");
    ngValueService.createValue("System", "Fuel Gas System", "FGS");
    ngValueService.createValue("System", "Closed Cooling Water System", "CCW");
}

private void generateEquipmentTypes() {
    ngValueService.createValue("Equipment Type", "Manual Valve", "V");
    ngValueService.createValue("Equipment Type", "Motor Operated Valve", "MOV");
    ngValueService.createValue("Equipment Type", "Air Operated Valve", "AOV");
    ngValueService.createValue("Equipment Type", "Pressure Control Valve", "PCV");
    ngValueService.createValue("Equipment Type", "Temperature Control Valve", "TCV");
    ngValueService.createValue("Equipment Type", "Flow Control Valve", "FCV");
    ngValueService.createValue("Equipment Type", "Pump", "PMP");
    ngValueService.createValue("Equipment Type", "Compressor", "CMP");
    ngValueService.createValue("Equipment Type", "Transformer", "XRF");
    ngValueService.createValue("Equipment Type", "Pressure Transmitter", "PIT");
    ngValueService.createValue("Equipment Type", "Temperature Transmitter", "TIT");
    ngValueService.createValue("Equipment Type", "Flow Transmitter", "FIT");
}
}
