package com.dk_power.power_plant_java.sevice.angular.file;

import com.dk_power.power_plant_java.entities.files.ReferenceObject;
import com.dk_power.power_plant_java.repository.file.ReferenceObjectRepo;
import com.dk_power.power_plant_java.sevice.data_transfer.ExcelReaderService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional
@RequiredArgsConstructor
public class ReferenceObjectService {
    @Value("${files.root.path}")
    private String fileRootPath;
    private final ReferenceObjectRepo referenceObjectRepo;
    private final ExcelReaderService excelReaderService;


public void importHrsgValveList() throws Exception {
    Path excelPath = Paths.get(fileRootPath + "/pdf/Lists/Valve List.xlsx");
    List<Map<String, String>> data = excelReaderService.readExcelFile(excelPath.toString(), "HRSG");
    for (Map<String, String> d : data) {
        ReferenceObject referenceObject = new ReferenceObject();
        referenceObject.setReferenceGroup(ReferenceObject.ReferenceGroup.HRSG);
        referenceObject.setReferenceType(ReferenceObject.ReferenceType.VALVE_LIST);
        
        if (stringIsNotNullAndNotEmpty(d.get("Designation"))) referenceObject.setDescription(d.get("Designation"));
        if (stringIsNotNullAndNotEmpty(d.get("Item Tag"))) referenceObject.addTagNumber(d.get("Item Tag"));
        if (stringIsNotNullAndNotEmpty(d.get("John Cockerill PID Number"))) referenceObject.addFileNumber(d.get("John Cockerill PID Number"));
        if (stringIsNotNullAndNotEmpty(d.get("John Cockerill Valve Drawing Number"))) referenceObject.addFileNumber(d.get("John Cockerill Valve Drawing Number"));

        if (stringIsNotNullAndNotEmpty(d.get("Fluid"))) referenceObject.addCharacteristic("Fluid", d.get("Fluid"));
        if (stringIsNotNullAndNotEmpty(d.get("Fail safe position (Note 2)"))) referenceObject.addCharacteristic("Fail Safe Position", d.get("Fail safe position (Note 2)"));
        if (stringIsNotNullAndNotEmpty(d.get("Nominal Pipe Size In (Inch)"))) referenceObject.addCharacteristic("Nominal Pipe Size Inlet (Inch)", d.get("Nominal Pipe Size In (Inch)"));
        if (stringIsNotNullAndNotEmpty(d.get("Nominal Pipe Size Out (Inch)"))) referenceObject.addCharacteristic("Nominal Pipe Size Out (Inch)", d.get("Nominal Pipe Size Out (Inch)"));
        if (stringIsNotNullAndNotEmpty(d.get("Valve Type"))) referenceObject.addCharacteristic("Valve Type", d.get("Valve Type"));
        if (stringIsNotNullAndNotEmpty(d.get("Pipe Material In"))) referenceObject.addCharacteristic("Inlet Pipe Material", d.get("Pipe Material In"));
        if (stringIsNotNullAndNotEmpty(d.get("Pipe Material Out"))) referenceObject.addCharacteristic("Outlet Pipe Material", d.get("Pipe Material Out"));
        if (stringIsNotNullAndNotEmpty(d.get("Vlv Material"))) referenceObject.addCharacteristic("Valve Material", d.get("Vlv Material"));
        if (stringIsNotNullAndNotEmpty(d.get("MAWP psig"))) referenceObject.addCharacteristic("MAWP psig", d.get("MAWP psig"));
        if (stringIsNotNullAndNotEmpty(d.get("Design Temp. [°F]"))) referenceObject.addCharacteristic("Design Temp. [°F]", d.get("Design Temp. [°F]"));
        if (stringIsNotNullAndNotEmpty(d.get("MAWP[barg]"))) referenceObject.addCharacteristic("MAWP[barg]", d.get("MAWP[barg]"));
        if (stringIsNotNullAndNotEmpty(d.get("Design Temp. [°C]"))) referenceObject.addCharacteristic("Design Temp. [°C]", d.get("Design Temp. [°C]"));
        if (stringIsNotNullAndNotEmpty(d.get("Valve Class In"))) referenceObject.addCharacteristic("Valve Class In", d.get("Valve Class In"));
        if (stringIsNotNullAndNotEmpty(d.get("Valve Class Out"))) referenceObject.addCharacteristic("Valve Class Out", d.get("Valve Class Out"));
        if (stringIsNotNullAndNotEmpty(d.get("Pipe End In"))) referenceObject.addCharacteristic("Pipe End In", d.get("Pipe End In"));
        if (stringIsNotNullAndNotEmpty(d.get("Pipe End Out"))) referenceObject.addCharacteristic("Pipe End Out", d.get("Pipe End Out"));
        if (stringIsNotNullAndNotEmpty(d.get("Hydrotest Pressure [psig]"))) referenceObject.addCharacteristic("Hydrotest Pressure [psig]", d.get("Hydrotest Pressure [psig]"));
        if (stringIsNotNullAndNotEmpty(d.get("Hydrotest Pressure [barg]"))) referenceObject.addCharacteristic("Hydrotest Pressure [barg]", d.get("Hydrotest Pressure [barg]"));
        if (stringIsNotNullAndNotEmpty(d.get("Hydrotest Number"))) referenceObject.addCharacteristic("Hydrotest Number", d.get("Hydrotest Number"));
        if (stringIsNotNullAndNotEmpty(d.get("Cavity Over Pressure Protection (NOTE 3)"))) referenceObject.addCharacteristic("Cavity Over Pressure Protection (NOTE 3)", d.get("Cavity Over Pressure Protection (NOTE 3)"));
        if (stringIsNotNullAndNotEmpty(d.get("WBS Number"))) referenceObject.addCharacteristic("WBS Number", d.get("WBS Number"));

        if (stringIsNotNullAndNotEmpty(d.get("John Cockerill Valve Drawing Number"))) referenceObject.addReference("John Cockerill Valve Drawing Number", d.get("John Cockerill Valve Drawing Number"));
        if (stringIsNotNullAndNotEmpty(d.get("John Cockerill PID Number"))) referenceObject.addReference("John Cockerill PID Number", d.get("John Cockerill PID Number"));
        
        referenceObjectRepo.save(referenceObject);
    }
}

private boolean stringIsNotNullAndNotEmpty(String str) {
    return str!= null &&!str.isEmpty();
}

private Map<String, String> parseCharacteristics(String characteristicsString) {
    // Implement parsing logic for characteristics
    // This is a placeholder implementation
    Map<String, String> characteristics = new HashMap<>();
    if (characteristicsString != null && !characteristicsString.isEmpty()) {
        String[] pairs = characteristicsString.split(",");
        for (String pair : pairs) {
            String[] keyValue = pair.split(":");
            if (keyValue.length == 2) {
                characteristics.put(keyValue[0].trim(), keyValue[1].trim());
            }
        }
    }
    return characteristics;
}

private Map<String, String> parseReferences(String referencesString) {
    // Implement parsing logic for references
    // This is a placeholder implementation
    Map<String, String> references = new HashMap<>();
    if (referencesString != null && !referencesString.isEmpty()) {
        String[] pairs = referencesString.split(",");
        for (String pair : pairs) {
            String[] keyValue = pair.split(":");
            if (keyValue.length == 2) {
                references.put(keyValue[0].trim(), keyValue[1].trim());
            }
        }
    }
    return references;
}

    public void printAll() {
        List<ReferenceObject> referenceObjects = referenceObjectRepo.findAll();
        for (ReferenceObject referenceObject : referenceObjects) {
            System.out.println(referenceObject);
        }
    }
}
