package com.dk_power.power_plant_java.sevice.equipment;

import com.dk_power.power_plant_java.dto.equipment.LotoPointDto;
import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import com.dk_power.power_plant_java.mappers.UniversalMapper;
import com.dk_power.power_plant_java.repository.loto.LotoPointRepo;
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
public class LotoPointServiceImpl implements LotoPointService{
    private final LotoPointRepo lotoPointRepo;
    private final SessionFactory sessionFactory;
    private final UniversalMapper universalMapper;
    private final ExcelService excelService;


    public LotoPointServiceImpl(LotoPointRepo lotoPointRepo, SessionFactory sessionFactory, UniversalMapper universalMapper, @Qualifier("LotoPoint") ExcelService excelService) {
        this.lotoPointRepo = lotoPointRepo;
        this.sessionFactory = sessionFactory;
        this.universalMapper = universalMapper;
        this.excelService = excelService;
    }

    @Override
    public LotoPoint getEntity() {
        return new LotoPoint();
    }

    @Override
    public LotoPointDto getDto() {
        return new LotoPointDto();
    }

    @Override
    public LotoPointRepo getRepo() {
        return lotoPointRepo;
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
    public List<LotoPoint> transferExcelToDB() {
        List<Map<String, String>> excelPoints = excelService.getDataList();
        List<LotoPoint> lotoPoints = new ArrayList<>();

        for (Map<String, String> excelPoint : excelPoints) {
            LotoPoint point = new LotoPoint();
            point.setUnit(excelPoint.get("Unit"));
            point.setTagged(excelPoint.get("Tagged"));
            point.setLabel(excelPoint.get("ID"));
            point.setDescription(excelPoint.get("Description"));
            point.setLocation(excelPoint.get("Location"));
            point.setStandard(excelPoint.get("Standard"));
            point.setGeneralLocation(excelPoint.get("GENERAL LOCATION"));
            point.setEquipment(excelPoint.get("Equipment"));
            point.setExtraInfo(excelPoint.get("Extra Info"));
            point.setType(excelPoint.get("Type"));
            point.setSystem(excelPoint.get("System"));
            point.setNormalPosition(excelPoint.get("Normal Pos"));
            point.setIsolatedPosition(excelPoint.get("Iso Pos"));
            point.setFluid(excelPoint.get("Fluid"));
            point.setSize(excelPoint.get("Size"));
            point.setElectricalCheckStatus(excelPoint.get("T"));
            point.setRedTagId(excelPoint.get("Rec ID"));
            point.setRedTagId(excelPoint.get("Original ID"));

            lotoPoints.add(point);
            lotoPointRepo.save(point);
        }
        return lotoPoints;
    }


}
