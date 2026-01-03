package com.dk_power.power_plant_java.sevice.angular;

import com.dk_power.power_plant_java.sevice.angular.NgValueService;
import jakarta.persistence.GeneratedValue;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class DefaultValueGeneratorService {
    private final NgValueService ngValueService;

    public void generateAllValues() {
        generateSystems();
        generateEquipmentTypes();
        generatePermitStatuses();
        generateUnitValues();
        generateZeroEnergyTemplates();
        generateGroupValues();
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
        ngValueService.createValue("System", "Combustion Turbine", "CTP");
        ngValueService.createValue("System", "Steam Turbine", "STP");
        ngValueService.createValue("System", "Fuel Gas System", "FGS");
        ngValueService.createValue("System", "Closed Cooling Water System", "CCW");
        ngValueService.createValue("System", "Cold Reheat", "CRH");
        ngValueService.createValue("System", "Hot Reheat", "HRH");
        ngValueService.createValue("System", "Aux Steam", "AXS");
        ngValueService.createValue("System", "Instrument Air", "INA");
        ngValueService.createValue("System", "Lube Oil System", "LOS");
        ngValueService.createValue("System", "Chemical Feed System", "CCF");
        ngValueService.createValue("System", "Heat Trace", "HTS");
        ngValueService.createValue("System", "Air Cool Condenser", "ACC");
        ngValueService.createValue("System", "Blow Down System", "BDN");
        ngValueService.createValue("System", "Potable Water System", "PWS");
        ngValueService.createValue("System", "Fire Protection System", "FPS");
        ngValueService.createValue("System", "Sampling System", "SMP");
        ngValueService.createValue("System", "Compressed Gasses", "CMG");
        ngValueService.createValue("System", "Duct Burner", "BUR");
        ngValueService.createValue("System", "AFCU", "SCR");
        ngValueService.createValue("System", "Control Oil", "COS");
        ngValueService.createValue("System", "Seal Oil", "SOS");
        ngValueService.createValue("System", "Bulk Ammonia System", "AQA");
        ngValueService.createValue("System", "Sanitary Drain System", "SDR");
        ngValueService.createValue("System", "Plant Drain System", "PDR");
        ngValueService.createValue("System", "Waste Water Drain System", "WDR");
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
        ngValueService.createValue("Equipment Type", "Relief Valve", "PRV");
        ngValueService.createValue("Equipment Type", "Control Panel", "CPL");
        ngValueService.createValue("Equipment Type", "Heater-Dryer", "HTR");
        ngValueService.createValue("Equipment Type", "Skid", "SKD");
    }

    private void generatePermitStatuses(){
        ngValueService.createValue("Permit Status", "Active", "ACT");
        ngValueService.createValue("Permit Status", "Inactive", "INA");
        ngValueService.createValue("Permit Status", "Closed", "CLS");
    }

    private void generateUnitValues(){
        ngValueService.createValue("Unit", "Unit 1", "01");
        ngValueService.createValue("Unit", "Unit 2", "02");
        ngValueService.createValue("Unit", "BOP", "00");
    }

    private void generateZeroEnergyTemplates(){
        ngValueService.createValue("Zero Energy Template", "No", "NO");
        ngValueService.createValue("Zero Energy Template", "Yes", "YES");
    }

    private void generateGroupValues(){
        ngValueService.createValue("Group", "Fire Side", "FSD");
        ngValueService.createValue("Group", "Water Side", "WSD");
        ngValueService.createValue("Group", "Unit 1", "U1");
        ngValueService.createValue("Group", "Unit 2", "U2");
    }
}
