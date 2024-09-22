package com.dk_power.power_plant_java.sevice.data_transfer.excel.impl;

import com.dk_power.power_plant_java.entities.categories.Value;
import com.dk_power.power_plant_java.entities.equipment.ElectricalPanel;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.dk_power.power_plant_java.sevice.categories.ValueService;
import com.dk_power.power_plant_java.sevice.data_transfer.ExcelReaderService;
import com.dk_power.power_plant_java.sevice.data_transfer.excel.ElectricalPanelTransferService;
import com.dk_power.power_plant_java.sevice.equipment.ElectricalPanelService;
import com.dk_power.power_plant_java.sevice.file.FileService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class ElectricalPanelTransferServiceImpl implements ElectricalPanelTransferService {
    private final ExcelReaderService excelReaderService;
    private final FileService fileService;
    private final ValueService valueService;
    private final ElectricalPanelService electricalPanelService;
    @Override
    public void createElectricalPanelFileObjectsFromExcelList() {
        List<Map<String, String>> fileMaps = excelReaderService.readExcelFile("uploads/pdf/Electrical/Kiewit/panel_schedules/LIST OF PANELS.xlsx");
        Value fileType = valueService.valueSetup("File Type", "Electrical Panel Schedule");
        Value vendor = valueService.valueSetup("Vendor", "Kiewit");
        Value system = valueService.valueSetup("System", "Electrical");
        fileMaps.forEach(e->{
            FileObject file = new FileObject();
            file.setFileNumber(e.get("Document No."));
            file.setName(e.get("Title"));
            file.setFileType(fileType);
            file.setVendor(vendor);
            file.setSystem(system);
            file.setBaseLink("uploads");
            file.setExtension("jpg");
            file.buildFolder();
            file.buildFileLink();
            file.setRelatedSystems("Electrical,Electrical Panels");
            fileService.save(file);
        });
    }

    @Override
    public void connectPanelsFilesWithPanelObjects() {
        List<FileObject> panelFiles = fileService.getAll().stream().filter(e -> e.getFileType().getName().equalsIgnoreCase("Electrical Panel Schedule")).toList();
        List<ElectricalPanel> all = electricalPanelService.getAll();
        for (ElectricalPanel e : all) {
            List<FileObject> files = fileService.getIfNameContains(e.getTagNumber().toUpperCase().trim());
            if(files.size()>1) System.out.println(e.getTagNumber());
//            FileObject f = files!=null && files.size()>0 ? files.get(0) : null;
//            if(f!=null){
//                System.out.println(f.getId());
//                e.setPanelSchedule(f);
//                electricalPanelService.save(e);
//            }
        }
    }
}
