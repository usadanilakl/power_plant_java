package com.dk_power.power_plant_java.sevice.angular;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class DefaultValueGeneratorService {
    private final NgValueService ngValueService;

    public void generateAllValues() {
//         generateSystems();
//         generateEquipmentTypes();
//         generatePermitStatuses();
//         generateUnitValues();
//         generateZeroEnergyTemplates();
//         generateGroupValues();
//         generateEquipmentNameValues();
//         generateVendorValues();
//         generateFileTypeValues();
//         generateIsoPosValues();
//         generateNormPosValues();
//         generateLocationValues();
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
        ngValueService.createValue("Eq Type", "Manual Valve", "V");
        ngValueService.createValue("Eq Type", "Motor Operated Valve", "MOV");
        ngValueService.createValue("Eq Type", "Air Operated Valve", "AOV");
        ngValueService.createValue("Eq Type", "Pressure Control Valve", "PCV");
        ngValueService.createValue("Eq Type", "Temperature Control Valve", "TCV");
        ngValueService.createValue("Eq Type", "Flow Control Valve", "FCV");
        ngValueService.createValue("Eq Type", "Pump", "PMP");
        ngValueService.createValue("Eq Type", "Compressor", "CMP");
        ngValueService.createValue("Eq Type", "Transformer", "XRF");
        ngValueService.createValue("Eq Type", "Pressure Transmitter", "PIT");
        ngValueService.createValue("Eq Type", "Temperature Transmitter", "TIT");
        ngValueService.createValue("Eq Type", "Flow Transmitter", "FIT");
        ngValueService.createValue("Eq Type", "Relief Valve", "PRV");
        ngValueService.createValue("Eq Type", "Control Panel", "CPL");
        ngValueService.createValue("Eq Type", "Heater-Dryer", "HTR");
        ngValueService.createValue("Eq Type", "Skid", "SKD");
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

    private void generateEquipmentNameValues(){
        ngValueService.createValue("Equipment Name", "Strainer", "STR");
        ngValueService.createValue("Equipment Name", "Terminal Attemperator", "TERM ATTEMP");
        ngValueService.createValue("Equipment Name", "Interstage Attemperator", "INTERSTAGE ATTEMP");
        ngValueService.createValue("Equipment Name", "Boiler Feed Pump", "BFP");
        ngValueService.createValue("Equipment Name", "Condensate Pump", "CND PMP");
    }

    private void generateVendorValues(){
        ngValueService.createValue("Vendor", "Kiewit", "KWT");
    }

    private void generateFileTypeValues(){
        ngValueService.createValue("File Type", "PID", "PID");
    }

    private void generateIsoPosValues(){
        ngValueService.createValue("Iso Pos", "Open", "OPEN");
        ngValueService.createValue("Iso Pos", "Closed", "CLOSED");
        ngValueService.createValue("Iso Pos", "Throttled", "THRTL");
    }

    private void generateNormPosValues(){
        ngValueService.createValue("Norm Pos", "Open", "NO");
        ngValueService.createValue("Norm Pos", "Closed", "NC");
        ngValueService.createValue("Norm Pos", "Throttled", "THRTL");
    }

    private void generateLocationValues(){
        ngValueService.createValue("Location", "Switchyard", "SY");
        ngValueService.createValue("Location", "Control Room", "CR");
    }

    public void generateCommentTypes(){
        ngValueService.createValue("Comment Type", "General", "GEN");
        ngValueService.createValue("Comment Type", "Correction Needed", "COR");
        ngValueService.createValue("Comment Type", "Note", "NOTE");
        ngValueService.createValue("Comment Type", "QA", "QA");
    }
}
