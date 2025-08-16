package com.dk_power.power_plant_java.sevice.angular.file;

import com.dk_power.power_plant_java.entities.files.ReferenceObject;
import com.dk_power.power_plant_java.repository.file.ReferenceObjectRepo;
import com.dk_power.power_plant_java.sevice.data_transfer.ExcelReaderService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
@Transactional
@RequiredArgsConstructor
public class ReferenceObjectService {
    private final ReferenceObjectRepo referenceObjectRepo;
    private final ExcelReaderService excelReaderService;

    public void importReferenceObjects(String filePath) throws Exception {
        List<Map<String, String>> data = excelReaderService.readExcelFile(filePath);
        for (Map<String, String> d : data) {
            ReferenceObject referenceObject = new ReferenceObject();
//            referenceObject.setTagNumber(d.get("TagNumber"));
//            referenceObject.setFileNumber(d.get("FileNumber"));
            referenceObject.setCharacteristics(d.get("Characteristics"));
            referenceObject.setReferences(d.get("References"));
            referenceObjectRepo.save(referenceObject);
        }
    }
}
