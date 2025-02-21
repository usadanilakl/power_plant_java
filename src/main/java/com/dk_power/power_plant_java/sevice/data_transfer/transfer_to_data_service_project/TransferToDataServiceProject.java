package com.dk_power.power_plant_java.sevice.data_transfer.transfer_to_data_service_project;

import com.dk_power.power_plant_java.dto.data_service_project_dtos.categories.DS_ValueDto;
import com.dk_power.power_plant_java.dto.data_service_project_dtos.equipment.DS_LotoPointDto;
import com.dk_power.power_plant_java.dto.data_service_project_dtos.equipment.DS_TagNumberDto;
import com.dk_power.power_plant_java.dto.data_service_project_dtos.files.DS_FileElementDto;
import com.dk_power.power_plant_java.dto.data_service_project_dtos.files.DS_FileObjectDtoDS;
import com.dk_power.power_plant_java.entities.equipment.Equipment;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import com.dk_power.power_plant_java.sevice.equipment.impl.EquipmentServiceImpl;
import com.dk_power.power_plant_java.sevice.loto.loto_point.LotoPointServiceImpl;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.io.IOException;
import java.util.*;

@Service
@Transactional
@RequiredArgsConstructor
public class TransferToDataServiceProject {

    /*****************************************************************************************
     * POSSIBLE CONFLICTS AND CONFLICT RESOLUTION
     ****************************************************************************************/
    /**
     * MAIN OBJECTIVE:
     *      1. Process point by point.
     *      2. For each loto point: identify associated equipment, identify associated files, create file, file element and loto point DTOs.
     *      3. If step 2 encounters any issues, then conflict object will be created with conflict details and id reference to conflicted entities.
     *      4. Send created DTOs to Data Service Project and save references to each other: file to file, equipment to file element, loto point to loto point. (Use data service item id field);
     * POSSIBLE CONFLICTS:
     *     1. White spaces in equipment tag number and description. Need to remove them
     *     2. Coordinates having extra strings or missing parts. Need to resolve them manually.
     *     3. Duplicate equipment. Need to combine data between all duplicates - description, location, type, loto points.
     *     4. Equipment that have loto point associated with them do not contain loto point that matches equipment tagNumber. Need to manually find matching loto point for each equipment.
     *     5. Incomplete information: equipment type, vendor, location, specific location, description, isoPos, normPos.
     *     6. Description mismatch between units.
     *
     * TRANSFER FLOW:
     *
     *     1. Clean up tag and description leading and trailing spaces.
     *     2. Get all loto points that have associated equipment.
     *     3. For each loto point:
     *          identify associated equipment.
     *          find equipment matching loto point tag number or create tag mismatch conflict.
     *          verify that equipment doesn't have duplicates or create equipment duplicate conflict.
     *          identify that description and location matched between units.
     *          identify associated files
     *          create file dto, transfer or create conflict.
     *          create file element dto, transfer or create conflict.
     *          create loto point dto, transfer or create conflict.
     **/





    private final FileObjectTransferService fileObjectTransferService;
    private final FileElementTransferService fileElementTransferService;
    private final LotoPointTransferService lotoPointTransferService;

    public void transferExecution() throws IOException {
//        fileElementTransferService.identifyConflicts();
//        fileElementTransferService.identifyConflictedEquipment();

        fileObjectTransferService.cleanTransferData();
//        fileObjectTransferService.transferFileObjects();
//
        fileElementTransferService.clearFileElementTransferStatus();
//        fileElementTransferService.transferFileElements();
//
        fileElementTransferService.clearEquipmentTransferStatus();
//        fileElementTransferService.transferEquipment();
//        fileElementTransferService.lotoPointsWithNoConflicts();

        lotoPointTransferService.transferAllLotoPoints();

    }




}
