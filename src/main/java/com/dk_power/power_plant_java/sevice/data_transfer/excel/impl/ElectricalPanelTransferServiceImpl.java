package com.dk_power.power_plant_java.sevice.data_transfer.excel.impl;

import com.dk_power.power_plant_java.entities.categories.Value;
import com.dk_power.power_plant_java.entities.equipment.ElectricalPanel;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.dk_power.power_plant_java.sevice.categories.ValueService;
import com.dk_power.power_plant_java.sevice.data_transfer.ExcelReaderService;
import com.dk_power.power_plant_java.sevice.data_transfer.FileReaderService;
import com.dk_power.power_plant_java.sevice.data_transfer.excel.ElectricalPanelTransferService;
import com.dk_power.power_plant_java.sevice.equipment.ElectricalPanelService;
import com.dk_power.power_plant_java.sevice.file.FileService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.File;
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
    private final FileReaderService fileReaderService;
    @Override
    public void createElectricalPanelFileObjectsFromExcelList() {
        List<Map<String, String>> fileMaps = excelReaderService.readExcelFile("uploads/pdf/Electrical/Kiewit/panel_schedules/LIST OF PANELS.xlsx");
        List<File> files = fileReaderService.getFilesInFolderUsingFilesList("uploads/pdf/Electrical Panel Schedule/Kiewit");
        Value fileType = valueService.valueSetup("File Type", "Electrical Panel Schedule");
        Value vendor = valueService.valueSetup("Vendor", "Kiewit");
        Value system = valueService.valueSetup("System", "Electrical");
        fileMaps.forEach(e->{
            File title = files.stream().filter(f -> f.getName().trim().toLowerCase().contains(e.get("Document No.").toLowerCase().trim())).findFirst().orElse(null);
            String fileNum = title!=null ? title.getName().replace(".pdf","") : e.get("Document No.");
//            System.out.println(fileNum);
            FileObject file = new FileObject();
            file.setFileNumber(fileNum);
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
//            FileObject f = files!=null && files.size()>0 ? files.get(0) : null;
//            if(f!=null){
//                System.out.println(f.getId());
//                e.setPanelSchedule(f);
//                electricalPanelService.save(e);
//            }
        }
    }

    @Override
    public void createFileObjectsForPanelPictures() {
        List<File> files = fileReaderService.getFilesInFolderUsingFilesList("uploads/jpg/Electrical/Kiewit/panel_schedule_pics");
        Value fileType = valueService.valueSetup("File Type", "Electrical Panel Schedule Picture");
        Value vendor = valueService.valueSetup("Vendor", "Kiewit");
        Value system = valueService.valueSetup("System", "Electrical");
        for (File f : files) {
            String fileNum = f.getName().replace(".jpg","");
            FileObject file = new FileObject();
            file.setFileNumber(fileNum);
            file.setFileType(fileType);
            file.setVendor(vendor);
            file.setSystem(system);
            file.setBaseLink("uploads");
            file.setExtension("jpg");
            file.buildFolder();
            file.buildFileLink();
            file.setRelatedSystems("Electrical,Electrical Panels");
            fileService.save(file);
        }
    }

    @Override
    public void deleteOldPanelObjects() {
        fileService.getAll().forEach(e->{
            if(e.getFileLink().contains("Panel")) fileService.hardDelete(e);
        });
    }
}
