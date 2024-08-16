package com.dk_power.power_plant_java.sevice.data_transfer.excel.impl;

import com.dk_power.power_plant_java.dto.data_transfer.ElectricalTableDto;
import com.dk_power.power_plant_java.entities.data_transfer.ElectricalTable;
import com.dk_power.power_plant_java.mappers.UniversalMapper;
import com.dk_power.power_plant_java.repository.data_transfer.ElectricalTableRepo;
import com.dk_power.power_plant_java.sevice.data_transfer.excel.ElectricalTableService;
import com.dk_power.power_plant_java.sevice.data_transfer.excel.ExcelService;
import org.hibernate.SessionFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@Transactional
public class ElectricalTableServiceImpl implements ElectricalTableService {
    private final ElectricalTableRepo electricalTableRepo;
    private final UniversalMapper universalMapper;
    private final SessionFactory sessionFactory;
    private final ExcelService excelService;

    public ElectricalTableServiceImpl(ElectricalTableRepo electricalTableRepo, UniversalMapper universalMapper, SessionFactory sessionFactory, @Qualifier("elTable") ExcelService excelService) {
        this.electricalTableRepo = electricalTableRepo;
        this.universalMapper = universalMapper;
        this.sessionFactory = sessionFactory;
        this.excelService = excelService;
    }

    @Override
    public ElectricalTable getEntity() {
        return new ElectricalTable();
    }

    @Override
    public ElectricalTableDto getDto() {
        return new ElectricalTableDto();
    }

    @Override
    public ElectricalTableRepo getRepo() {
        return electricalTableRepo;
    }

    @Override
    public UniversalMapper getMapper() {
        return universalMapper;
    }

    @Override
    public SessionFactory getSessionFactory() {
        return sessionFactory;
    }

    @Override
    public List<ElectricalTable> transferExcelToDB() {
        List<ElectricalTable> table = new ArrayList<>();
        List<Map<String, String>> dataList = excelService.getDataList();

        for (Map<String, String> data : dataList) {
            ElectricalTable equipmentInfo = new ElectricalTable();
            equipmentInfo.setPowerUser(data.get("Equipment"));
            equipmentInfo.setTagNumber(data.get("Tag Number"));
            equipmentInfo.setBreakerLocation(data.get("Breaker location"));
            equipmentInfo.setCategory(data.get("Category"));
            equipmentInfo.setBus(data.get("Bus"));
            equipmentInfo.setOldId(data.get("Old Id"));
            equipmentInfo.setBreakerType(data.get("Breaker type"));

            table.add(equipmentInfo);
            save(equipmentInfo);
        }

        return table;
    }
}
