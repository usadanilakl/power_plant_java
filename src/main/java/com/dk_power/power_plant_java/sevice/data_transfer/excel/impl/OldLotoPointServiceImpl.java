package com.dk_power.power_plant_java.sevice.data_transfer.excel.impl;

import com.dk_power.power_plant_java.dto.data_transfer.OldLotoPointDto;
import com.dk_power.power_plant_java.entities.data_transfer.OldLotoPoint;
import com.dk_power.power_plant_java.mappers.UniversalMapper;
import com.dk_power.power_plant_java.repository.data_transfer.OldLotoPointRepo;
import com.dk_power.power_plant_java.sevice.data_transfer.excel.ExcelService;
import com.dk_power.power_plant_java.sevice.data_transfer.excel.OldLotoPointService;
import org.hibernate.SessionFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class OldLotoPointServiceImpl implements OldLotoPointService {
    private final OldLotoPointRepo oldLotoPointRepo;
    private final UniversalMapper universalMapper;
    private final ExcelService excelService;
    private final SessionFactory sessionFactory;

    public OldLotoPointServiceImpl(OldLotoPointRepo oldLotoPointRepo, UniversalMapper universalMapper, @Qualifier("OldLotoPoint") ExcelService excelService, SessionFactory sessionFactory) {
        this.oldLotoPointRepo = oldLotoPointRepo;
        this.universalMapper = universalMapper;
        this.excelService = excelService;
        this.sessionFactory = sessionFactory;
    }

    @Override
    public OldLotoPoint getEntity() {
        return new OldLotoPoint();
    }

    @Override
    public OldLotoPointDto getDto() {
        return new OldLotoPointDto();
    }

    @Override
    public OldLotoPointRepo getRepo() {
        return oldLotoPointRepo;
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
    public List<OldLotoPoint> transferExcelToDB() {
        List<OldLotoPoint> dataList = new ArrayList<>();
        List<Map<String, Object>> listOfMaps = excelService.getDataListObject();

        for (Map<String, Object> map : listOfMaps) {
            OldLotoPoint data = new OldLotoPoint();

            data.setRecId((String) map.get("Rec ID"));
            data.setStatus((String) map.get("Status"));
            data.setIsolationDeviceDescription((String) map.get("Isolation Deveice Description - 65 character limit"));
            data.setIsolationDevicePnId((String) map.get("Isolation Device PNID - 35 character limit"));
            data.setIsolationDeviceLocation((String) map.get("Isolation Deveice Location - 65 character limit"));
            data.setDefaultIsolatedPosition((String) map.get("Default Isolated Position - 30 character limit"));
            data.setNormalPosition((String) map.get("Normal Position - 30 character limit"));

            dataList.add(data);
            oldLotoPointRepo.save(data);
        }

        return dataList;
    }
}
