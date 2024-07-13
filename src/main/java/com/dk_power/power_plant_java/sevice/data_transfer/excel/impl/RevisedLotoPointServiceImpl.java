package com.dk_power.power_plant_java.sevice.data_transfer.excel.impl;

import com.dk_power.power_plant_java.dto.data_transfer.RevisedLotoPointsDto;
import com.dk_power.power_plant_java.entities.data_transfer.RevisedLotoPoints;
import com.dk_power.power_plant_java.mappers.UniversalMapper;
import com.dk_power.power_plant_java.repository.data_transfer.RevisedPointRepo;
import com.dk_power.power_plant_java.sevice.data_transfer.excel.ExcelService;
import com.dk_power.power_plant_java.sevice.data_transfer.excel.RevisedLotoPointService;
import org.hibernate.SessionFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class RevisedLotoPointServiceImpl implements RevisedLotoPointService {
    private final RevisedPointRepo revisedPointRepo;
    private final UniversalMapper universalMapper;
    private final ExcelService excelService;
    private final SessionFactory sessionFactory;

    public RevisedLotoPointServiceImpl(RevisedPointRepo revisedPointRepo, UniversalMapper universalMapper, @Qualifier("LotoPoint") ExcelService excelService, SessionFactory sessionFactory) {
        this.revisedPointRepo = revisedPointRepo;
        this.universalMapper = universalMapper;
        this.excelService = excelService;
        this.sessionFactory = sessionFactory;
    }

    @Override
    public RevisedLotoPoints getEntity() {
        return new RevisedLotoPoints();
    }

    @Override
    public RevisedLotoPointsDto getDto() {
        return new RevisedLotoPointsDto();
    }

    @Override
    public RevisedPointRepo getRepo() {
        return revisedPointRepo;
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
    public List<RevisedLotoPoints> transferExcelToDB() {
        List<RevisedLotoPoints> dataList = new ArrayList<>();

        for (Map<String, String> map : excelService.getDataList()) {
            RevisedLotoPoints data = new RevisedLotoPoints();

            data.setUnit(map.get("Unit"));
            data.setTagged(map.get("Tagged"));
            data.setTagNumber(map.get("ID"));
            data.setDescription(map.get("Description"));
            data.setLocation(map.get("Location"));
            data.setStandard(map.get("Standard"));
            data.setGeneralLocation(map.get("GENERAL LOCATION"));
            data.setEquipment(map.get("Equipment"));
            data.setExtraInfo(map.get("Extra Info"));
            data.setType(map.get("Type"));
            data.setSystem(map.get("System"));
            data.setPid(map.get("P&ID"));
            data.setNormalPos(map.get("Normal Pos"));
            data.setIsoPos(map.get("Iso Pos"));
            data.setFluid(map.get("Fluid"));
            data.setSize(map.get("Size"));
            data.setRecId(map.get("Rec ID"));
            data.setNum(map.get("Num"));
            data.setTemperature(map.get("T"));
            data.setNum2(map.get("num2"));
            data.setOtherPid(map.get("OTHER PID"));
            data.setOriginalId(map.get("Original ID"));
            data.setEquip(map.get("Equip"));

            dataList.add(data);
            revisedPointRepo.save(data);
        }

        return dataList;

    }
}
