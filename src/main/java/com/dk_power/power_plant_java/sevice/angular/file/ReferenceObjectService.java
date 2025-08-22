package com.dk_power.power_plant_java.sevice.angular.file;

import com.dk_power.power_plant_java.entities.files.FileObject;
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
    private final NgFileService fileService;

    public List<ReferenceObject> getAll(){
        return referenceObjectRepo.findAll();
    }


    public void importHrsgValveList() throws Exception {
        Path excelPath = Paths.get(fileRootPath + "/pdf/Lists/Valve List.xlsx");
        List<Map<String, String>> data = excelReaderService.readExcelFile(excelPath.toString(), "HRSG");
        for (Map<String, String> d : data) {
            ReferenceObject referenceObject = new ReferenceObject();
            referenceObject.setReferenceGroup(ReferenceObject.ReferenceGroup.HRSG);
            referenceObject.setReferenceType(ReferenceObject.ReferenceType.VALVE_LIST);

            if (stringIsNotNullAndNotEmpty(d.get("Designation"))) referenceObject.setDescription(d.get("Designation"));
            if (stringIsNotNullAndNotEmpty(d.get("Item Tag"))) referenceObject.addTagNumber(d.get("Item Tag"));
            if (stringIsNotNullAndNotEmpty(d.get("John Cockerill PID Number")))
                referenceObject.addFileNumber(d.get("John Cockerill PID Number"));
            if (stringIsNotNullAndNotEmpty(d.get("John Cockerill Valve Drawing Number")))
                referenceObject.addFileNumber(d.get("John Cockerill Valve Drawing Number"));

            if (stringIsNotNullAndNotEmpty(d.get("Fluid"))) referenceObject.addCharacteristic("Fluid", d.get("Fluid"));
            if (stringIsNotNullAndNotEmpty(d.get("Fail safe position (Note 2)")))
                referenceObject.addCharacteristic("Fail Safe Position", d.get("Fail safe position (Note 2)"));
            if (stringIsNotNullAndNotEmpty(d.get("Nominal Pipe Size In (Inch)")))
                referenceObject.addCharacteristic("Nominal Pipe Size Inlet (Inch)", d.get("Nominal Pipe Size In (Inch)"));
            if (stringIsNotNullAndNotEmpty(d.get("Nominal Pipe Size Out (Inch)")))
                referenceObject.addCharacteristic("Nominal Pipe Size Out (Inch)", d.get("Nominal Pipe Size Out (Inch)"));
            if (stringIsNotNullAndNotEmpty(d.get("Valve Type")))
                referenceObject.addCharacteristic("Valve Type", d.get("Valve Type"));
            if (stringIsNotNullAndNotEmpty(d.get("Pipe Material In")))
                referenceObject.addCharacteristic("Inlet Pipe Material", d.get("Pipe Material In"));
            if (stringIsNotNullAndNotEmpty(d.get("Pipe Material Out")))
                referenceObject.addCharacteristic("Outlet Pipe Material", d.get("Pipe Material Out"));
            if (stringIsNotNullAndNotEmpty(d.get("Vlv Material")))
                referenceObject.addCharacteristic("Valve Material", d.get("Vlv Material"));
            if (stringIsNotNullAndNotEmpty(d.get("MAWP psig")))
                referenceObject.addCharacteristic("MAWP psig", d.get("MAWP psig"));
            if (stringIsNotNullAndNotEmpty(d.get("Design Temp. [°F]")))
                referenceObject.addCharacteristic("Design Temp. [°F]", d.get("Design Temp. [°F]"));
            if (stringIsNotNullAndNotEmpty(d.get("MAWP[barg]")))
                referenceObject.addCharacteristic("MAWP[barg]", d.get("MAWP[barg]"));
            if (stringIsNotNullAndNotEmpty(d.get("Design Temp. [°C]")))
                referenceObject.addCharacteristic("Design Temp. [°C]", d.get("Design Temp. [°C]"));
            if (stringIsNotNullAndNotEmpty(d.get("Valve Class In")))
                referenceObject.addCharacteristic("Valve Class In", d.get("Valve Class In"));
            if (stringIsNotNullAndNotEmpty(d.get("Valve Class Out")))
                referenceObject.addCharacteristic("Valve Class Out", d.get("Valve Class Out"));
            if (stringIsNotNullAndNotEmpty(d.get("Pipe End In")))
                referenceObject.addCharacteristic("Pipe End In", d.get("Pipe End In"));
            if (stringIsNotNullAndNotEmpty(d.get("Pipe End Out")))
                referenceObject.addCharacteristic("Pipe End Out", d.get("Pipe End Out"));
            if (stringIsNotNullAndNotEmpty(d.get("Hydrotest Pressure [psig]")))
                referenceObject.addCharacteristic("Hydrotest Pressure [psig]", d.get("Hydrotest Pressure [psig]"));
            if (stringIsNotNullAndNotEmpty(d.get("Hydrotest Pressure [barg]")))
                referenceObject.addCharacteristic("Hydrotest Pressure [barg]", d.get("Hydrotest Pressure [barg]"));
            if (stringIsNotNullAndNotEmpty(d.get("Hydrotest Number")))
                referenceObject.addCharacteristic("Hydrotest Number", d.get("Hydrotest Number"));
            if (stringIsNotNullAndNotEmpty(d.get("Cavity Over Pressure Protection (NOTE 3)")))
                referenceObject.addCharacteristic("Cavity Over Pressure Protection (NOTE 3)", d.get("Cavity Over Pressure Protection (NOTE 3)"));
            if (stringIsNotNullAndNotEmpty(d.get("WBS Number")))
                referenceObject.addCharacteristic("WBS Number", d.get("WBS Number"));

            if (stringIsNotNullAndNotEmpty(d.get("John Cockerill Valve Drawing Number")))
                referenceObject.addReference("John Cockerill Valve Drawing Number", d.get("John Cockerill Valve Drawing Number"));
            if (stringIsNotNullAndNotEmpty(d.get("John Cockerill PID Number")))
                referenceObject.addReference("John Cockerill PID Number", d.get("John Cockerill PID Number"));

            referenceObjectRepo.save(referenceObject);
        }
    }

    public void importBopValveList() throws Exception {
        Path excelPath = Paths.get(fileRootPath + "/pdf/Lists/Valve List.xlsx");
        List<Map<String, String>> data = excelReaderService.readExcelFile(excelPath.toString(), "BOP");
        List<FileObject> files = fileService.getFilesWithRelatedTags();
        for (Map<String, String> d : data) {
            ReferenceObject referenceObject = new ReferenceObject();
            referenceObject.setReferenceGroup(ReferenceObject.ReferenceGroup.BOP);
            referenceObject.setReferenceType(ReferenceObject.ReferenceType.VALVE_LIST);

            if (stringIsNotNullAndNotEmpty(d.get("Description"))) referenceObject.setDescription(d.get("Description"));
            if (stringIsNotNullAndNotEmpty(d.get("Tag Number"))) referenceObject.addTagNumber(d.get("Tag Number"));
            if(stringIsNotNullAndNotEmpty(d.get("P&ID"))) referenceObject.addFileNumber(d.get("P&ID"));
            for(FileObject file : files){

                if(leaveLettersAndNumbersOnly(file.getRelatedTags()).toLowerCase().contains(leaveLettersAndNumbersOnly(d.get("Tag Number")).toLowerCase())){
                    referenceObject.addFileNumber(file.getFileNumber());
                }
            }

            if(stringIsNotNullAndNotEmpty(d.get("Size (in)"))) referenceObject.addCharacteristic("Size (in)", d.get("Size (in)"));
            if(stringIsNotNullAndNotEmpty(d.get("Valve Type"))) referenceObject.addCharacteristic("Valve Type", d.get("Valve Type"));
            if(stringIsNotNullAndNotEmpty(d.get("System"))) referenceObject.addCharacteristic("System", d.get("System"));
            if(stringIsNotNullAndNotEmpty(d.get("Pipe Spec"))) referenceObject.addCharacteristic("Pipe Spec", d.get("Pipe Spec"));
            if(stringIsNotNullAndNotEmpty(d.get("Working Fluid"))) referenceObject.addCharacteristic("Working Fluid", d.get("Working Fluid"));
            if(stringIsNotNullAndNotEmpty(d.get("Rating"))) referenceObject.addCharacteristic("Rating", d.get("Rating"));
            if(stringIsNotNullAndNotEmpty(d.get("End Prep1"))) referenceObject.addCharacteristic("End Prep1", d.get("End Prep1"));
            if(stringIsNotNullAndNotEmpty(d.get("End Prep1"))) referenceObject.addCharacteristic("End Prep1", d.get("End Prep1"));
            if(stringIsNotNullAndNotEmpty(d.get("End Prep2"))) referenceObject.addCharacteristic("End Prep2", d.get("End Prep2"));
            if(stringIsNotNullAndNotEmpty(d.get("Design Press (psig)"))) referenceObject.addCharacteristic("Design Press (psig)", d.get("Design Press (psig)"));
            if(stringIsNotNullAndNotEmpty(d.get("Design Temp (F)"))) referenceObject.addCharacteristic("Design Temp (F)", d.get("Design Temp (F)"));
            if(stringIsNotNullAndNotEmpty(d.get("Valve Schedule"))) referenceObject.addCharacteristic("Valve Schedule", d.get("Valve Schedule"));
            if(stringIsNotNullAndNotEmpty(d.get("Insulation Thickness"))) referenceObject.addCharacteristic("Insulation Thickness", d.get("Insulation Thickness"));
            if(stringIsNotNullAndNotEmpty(d.get("Heat Traced"))) referenceObject.addCharacteristic("Heat Traced", d.get("Heat Traced"));
            if(stringIsNotNullAndNotEmpty(d.get("Comments"))) referenceObject.addCharacteristic("Comments", d.get("Comments"));


            if (stringIsNotNullAndNotEmpty(d.get("Line Number")))
                referenceObject.addReference("Line Number", d.get("Line Number"));
            if (stringIsNotNullAndNotEmpty(d.get("P&ID")))
                referenceObject.addReference("P&ID", d.get("P&ID"));

            referenceObjectRepo.save(referenceObject);
        }
    }

    public void importHrsgPipeList() throws Exception {
        Path excelPath = Paths.get(fileRootPath + "/pdf/Lists/Piping List.xlsx");
        List<Map<String, String>> data = excelReaderService.readExcelFile(excelPath.toString(), "HRSG Line List");
        for (Map<String, String> d : data) {
            ReferenceObject referenceObject = new ReferenceObject();
            referenceObject.setReferenceGroup(ReferenceObject.ReferenceGroup.HRSG);
            referenceObject.setReferenceType(ReferenceObject.ReferenceType.PIPE_LIST);

            if (stringIsNotNullAndNotEmpty(d.get("Designation"))) referenceObject.setDescription(d.get("Designation"));
            if (stringIsNotNullAndNotEmpty(d.get("Item Tag"))) referenceObject.addTagNumber(d.get("Item Tag"));
            if (stringIsNotNullAndNotEmpty(d.get("Line Tag"))) referenceObject.addTagNumber(d.get("Line Tag"));
            if (stringIsNotNullAndNotEmpty(d.get("PID Number")))
                referenceObject.addFileNumber(d.get("PID Number"));
            if (stringIsNotNullAndNotEmpty(d.get("Isometric Numb")))
                referenceObject.addFileNumber(d.get("Isometric Numb"));

            if (stringIsNotNullAndNotEmpty(d.get("Pipe Spec"))) referenceObject.addCharacteristic("Pipe Spec", d.get("Pipe Spec"));
            if (stringIsNotNullAndNotEmpty(d.get("Nominal size [Inch]"))) referenceObject.addCharacteristic("Nominal size [Inch]", d.get("Nominal size [Inch]"));
            if (stringIsNotNullAndNotEmpty(d.get("Outside Diameter OD [inch]"))) referenceObject.addCharacteristic("Outside Diameter OD [inch]", d.get("Outside Diameter OD [inch]"));
            if (stringIsNotNullAndNotEmpty(d.get("Thickness [inch]"))) referenceObject.addCharacteristic("Thickness [inch]", d.get("Thickness [inch]"));
            if (stringIsNotNullAndNotEmpty(d.get("Nominal Size [mm]"))) referenceObject.addCharacteristic("Nominal Size [mm]", d.get("Nominal Size [mm]"));
            if (stringIsNotNullAndNotEmpty(d.get("Outside Diameter OD [mm]"))) referenceObject.addCharacteristic("Outside Diameter OD [mm]", d.get("Outside Diameter OD [mm]"));
            if (stringIsNotNullAndNotEmpty(d.get("Thickness [mm]"))) referenceObject.addCharacteristic("Thickness [mm]", d.get("Thickness [mm]"));
            if (stringIsNotNullAndNotEmpty(d.get("Schedule"))) referenceObject.addCharacteristic("Schedule", d.get("Schedule"));
            if (stringIsNotNullAndNotEmpty(d.get("Pipe Material"))) referenceObject.addCharacteristic("Pipe Material", d.get("Pipe Material"));
            if (stringIsNotNullAndNotEmpty(d.get("Fluid"))) referenceObject.addCharacteristic("Fluid", d.get("Fluid"));
            if (stringIsNotNullAndNotEmpty(d.get("Design Press. [psig]"))) referenceObject.addCharacteristic("Design Press. [psig]", d.get("Design Press. [psig]"));
            if (stringIsNotNullAndNotEmpty(d.get("Design Temp. [°F]"))) referenceObject.addCharacteristic("Design Temp. [°F]", d.get("Design Temp. [°F]"));
            if (stringIsNotNullAndNotEmpty(d.get("Work. Press. [psig]"))) referenceObject.addCharacteristic("Work. Press. [psig]", d.get("Work. Press. [psig]"));
            if (stringIsNotNullAndNotEmpty(d.get("Work. Temp. [°F]"))) referenceObject.addCharacteristic("Work. Temp. [°F]", d.get("Work. Temp. [°F]"));
            if (stringIsNotNullAndNotEmpty(d.get("Max working Temp.[°F]"))) referenceObject.addCharacteristic("Max working Temp.[°F]", d.get("Max working Temp.[°F]"));
            if (stringIsNotNullAndNotEmpty(d.get("Temp. for insulation [°F]"))) referenceObject.addCharacteristic("Temp. for insulation [°F]", d.get("Temp. for insulation [°F]"));
            if (stringIsNotNullAndNotEmpty(d.get("Design Press. [barg]"))) referenceObject.addCharacteristic("Design Press. [barg]", d.get("Design Press. [barg]"));
            if (stringIsNotNullAndNotEmpty(d.get("Work. Temp. [°C]"))) referenceObject.addCharacteristic("Work. Temp. [°C]", d.get("Work. Temp. [°C]"));
            if (stringIsNotNullAndNotEmpty(d.get("Temp. for insulation [°C]"))) referenceObject.addCharacteristic("Temp. for insulation [°C]", d.get("Temp. for insulation [°C]"));
            if (stringIsNotNullAndNotEmpty(d.get("Insulation Thickness [inch] [Note 1]"))) referenceObject.addCharacteristic("Insulation Thickness [inch] [Note 1]", d.get("Insulation Thickness [inch] [Note 1]"));
            if (stringIsNotNullAndNotEmpty(d.get("Insulation Thickness [mm] [Note 1]"))) referenceObject.addCharacteristic("Insulation Thickness [mm] [Note 1]", d.get("Insulation Thickness [mm] [Note 1]"));
            if (stringIsNotNullAndNotEmpty(d.get("Heat Tracing"))) referenceObject.addCharacteristic("Heat Tracing", d.get("Heat Tracing"));
            if (stringIsNotNullAndNotEmpty(d.get("Hydrotest Circuit Number (refer to 2080_89P02)"))) referenceObject.addCharacteristic("Hydrotest Circuit Number (refer to 2080_89P02)", d.get("Hydrotest Circuit Number (refer to 2080_89P02)"));
            if (stringIsNotNullAndNotEmpty(d.get("Hydrotest pressure [psig]"))) referenceObject.addCharacteristic("Hydrotest pressure [psig]", d.get("Hydrotest pressure [psig]"));
            if (stringIsNotNullAndNotEmpty(d.get("Hydrotest pressure [barg]"))) referenceObject.addCharacteristic("Hydrotest pressure [barg]", d.get("Hydrotest pressure [barg]"));
            if (stringIsNotNullAndNotEmpty(d.get("Remarks"))) referenceObject.addCharacteristic("Remarks", d.get("Remarks"));
            if (stringIsNotNullAndNotEmpty(d.get("Location on P&ID"))) referenceObject.addCharacteristic("Location on P&ID", d.get("Location on P&ID"));
            if (stringIsNotNullAndNotEmpty(d.get("Rev"))) referenceObject.addCharacteristic("Rev", d.get("Rev"));


            if (stringIsNotNullAndNotEmpty(d.get("PID Number")))
                referenceObject.addReference("PID Number", d.get("PID Number"));
            if (stringIsNotNullAndNotEmpty(d.get("Isometric Numb")))
                referenceObject.addReference("Isometric Number", d.get("Isometric Numb"));

            referenceObjectRepo.save(referenceObject);
        }
    }

    public void importBopPipeList() throws Exception {
        Path excelPath = Paths.get(fileRootPath + "/pdf/Lists/Piping List.xlsx");
        List<Map<String, String>> data = excelReaderService.readExcelFile(excelPath.toString(), "Kiewit Line List");
        for (Map<String, String> d : data) {
            ReferenceObject referenceObject = new ReferenceObject();
            referenceObject.setReferenceGroup(ReferenceObject.ReferenceGroup.BOP);
            referenceObject.setReferenceType(ReferenceObject.ReferenceType.PIPE_LIST);

            if (stringIsNotNullAndNotEmpty(d.get("Description"))) referenceObject.setDescription(d.get("Description"));
            if (stringIsNotNullAndNotEmpty(d.get("Line Number"))) referenceObject.addTagNumber(d.get("Line Number"));
            if(stringIsNotNullAndNotEmpty(d.get("P&ID"))){
                String[] files = d.get("P&ID").split(";");
                for(String file : files){
                    referenceObject.addFileNumber(file);
                }
            }

            if(stringIsNotNullAndNotEmpty(d.get("Line Number")) && stringIsNotNullAndNotEmpty(d.get("System"))){
                int index = d.get("Line Number").indexOf(d.get("System"));
                if(index!=-1){
                    String fileNumber = d.get("Line Number").substring(index, index+7);
                    referenceObject.addFileNumber(fileNumber);
                }
            }

            if(stringIsNotNullAndNotEmpty(d.get("Sortable Size"))) referenceObject.addCharacteristic("Sortable Size", d.get("Sortable Size"));
            if(stringIsNotNullAndNotEmpty(d.get("System"))) referenceObject.addCharacteristic("System", d.get("System"));
            if(stringIsNotNullAndNotEmpty(d.get("Pipe Spec"))) referenceObject.addCharacteristic("Pipe Spec", d.get("Pipe Spec"));
            if(stringIsNotNullAndNotEmpty(d.get("Working Fluid"))) referenceObject.addCharacteristic("Working Fluid", d.get("Working Fluid"));
            if(stringIsNotNullAndNotEmpty(d.get("Unit"))) referenceObject.addCharacteristic("Unit", d.get("Unit"));
            if(stringIsNotNullAndNotEmpty(d.get("Design Press (psig)"))) referenceObject.addCharacteristic("Design Press (psig)", d.get("Design Press (psig)"));
            if(stringIsNotNullAndNotEmpty(d.get("Design Temp (F)"))) referenceObject.addCharacteristic("Design Temp (F)", d.get("Design Temp (F)"));
            if(stringIsNotNullAndNotEmpty(d.get("Schedule"))) referenceObject.addCharacteristic("Schedule", d.get("Schedule"));
            if(stringIsNotNullAndNotEmpty(d.get("Max Op Press (psig)"))) referenceObject.addCharacteristic("Max Op Press (psig)", d.get("Max Op Press (psig)"));
            if(stringIsNotNullAndNotEmpty(d.get("Norm Op Press (psig)"))) referenceObject.addCharacteristic("Norm Op Press (psig)", d.get("Norm Op Press (psig)"));
            if(stringIsNotNullAndNotEmpty(d.get("Min Op Press (psig)"))) referenceObject.addCharacteristic("Min Op Press (psig)", d.get("Min Op Press (psig)"));
            if(stringIsNotNullAndNotEmpty(d.get("Test Press (psig)"))) referenceObject.addCharacteristic("Test Press (psig)", d.get("Test Press (psig)"));
            if(stringIsNotNullAndNotEmpty(d.get("Test Medium"))) referenceObject.addCharacteristic("Test Medium", d.get("Test Medium"));
            if(stringIsNotNullAndNotEmpty(d.get("Max Op Temp (F)"))) referenceObject.addCharacteristic("Max Op Temp (F)", d.get("Max Op Temp (F)"));
            if(stringIsNotNullAndNotEmpty(d.get("Norm Op Temp (F)"))) referenceObject.addCharacteristic("Norm Op Temp (F)", d.get("Norm Op Temp (F)"));
            if(stringIsNotNullAndNotEmpty(d.get("Min Op Temp (F)"))) referenceObject.addCharacteristic("Min Op Temp (F)", d.get("Min Op Temp (F)"));
            if(stringIsNotNullAndNotEmpty(d.get("Insulation Spec"))) referenceObject.addCharacteristic("Insulation Spec", d.get("Insulation Spec"));
            if(stringIsNotNullAndNotEmpty(d.get("Insulation Thickness"))) referenceObject.addCharacteristic("Insulation Thickness", d.get("Insulation Thickness"));
            if(stringIsNotNullAndNotEmpty(d.get("Heat Traced"))) referenceObject.addCharacteristic("Heat Traced", d.get("Heat Traced"));
            if(stringIsNotNullAndNotEmpty(d.get("Cathodic Protection"))) referenceObject.addCharacteristic("Cathodic Protection", d.get("Cathodic Protection"));
            if(stringIsNotNullAndNotEmpty(d.get("Comments"))) referenceObject.addCharacteristic("Comments", d.get("Comments"));
            if(stringIsNotNullAndNotEmpty(d.get("93.70.02"))) referenceObject.addCharacteristic("93.70.02", d.get("93.70.02"));
//            if(stringIsNotNullAndNotEmpty(d.get("unknown"))) referenceObject.addCharacteristic("unknown", d.get("unknown"));
//            if(stringIsNotNullAndNotEmpty(d.get("unknown2"))) referenceObject.addCharacteristic("unknown2", d.get("unknown2"));


            if (stringIsNotNullAndNotEmpty(d.get("P&ID")))
                referenceObject.addReference("P&ID", d.get("P&ID"));

            referenceObjectRepo.save(referenceObject);
        }
    }



    private boolean stringIsNotNullAndNotEmpty(String str) {
        return str != null && !str.isEmpty();
    }
    private String leaveLettersAndNumbersOnly(String str) {
        if (str == null) {
            return null;
        }
        return str.replaceAll("[^a-zA-Z0-9]", "");
    }


    public void printAll() {
        List<ReferenceObject> referenceObjects = referenceObjectRepo.findAll();
        for (ReferenceObject referenceObject : referenceObjects) {
            System.out.println(referenceObject);
        }
    }
}
