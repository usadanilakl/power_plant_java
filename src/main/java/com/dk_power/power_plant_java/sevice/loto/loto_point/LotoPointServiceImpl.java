package com.dk_power.power_plant_java.sevice.loto.loto_point;

import com.dk_power.power_plant_java.dto.permits.LotoPointDto;
import com.dk_power.power_plant_java.dto.permits.LotoPointDtoLight;
import com.dk_power.power_plant_java.entities.categories.Value;
import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import com.dk_power.power_plant_java.mappers.LotoPointMapper;
import com.dk_power.power_plant_java.repository.loto.LotoPointRepo;
import com.dk_power.power_plant_java.sevice.data_transfer.excel.ExcelService;
import org.hibernate.SessionFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@Transactional
public class LotoPointServiceImpl implements LotoPointService {
    private final LotoPointRepo lotoPointRepo;
    private final SessionFactory sessionFactory;
    private final LotoPointMapper lotoPointMapper;
    private final ExcelService excelService;


    public LotoPointServiceImpl(LotoPointRepo lotoPointRepo, SessionFactory sessionFactory, @Lazy LotoPointMapper lotoPointMapper, @Qualifier("LotoPoint") ExcelService excelService) {
        this.lotoPointRepo = lotoPointRepo;
        this.sessionFactory = sessionFactory;
        this.lotoPointMapper = lotoPointMapper;
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
    public LotoPointMapper getMapper() {
        return lotoPointMapper;
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
            point.setTagNumber(excelPoint.get("ID"));
            point.setDescription(excelPoint.get("Description"));
            point.setSpecificLocation(excelPoint.get("Location"));
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
            point.setOldId(excelPoint.get("Original ID"));

            lotoPoints.add(point);
            lotoPointRepo.save(point);
        }
        return lotoPoints;
    }


    @Override
    public LotoPoint getByOldId(String oldId) {
        return lotoPointRepo.findByOldId(oldId);
    }

    @Override
    public List<LotoPoint> getByNormPos(Value oldVal) {
        return lotoPointRepo.findByNormPos(oldVal);
    }

    @Override
    public List<LotoPoint> getByIsoPos(Value oldVal) {
        return lotoPointRepo.findByIsoPos(oldVal);
    }

    @Override
    public LotoPoint convertToEntity(LotoPointDto dto) {
        return getMapper().convertToEntity(dto);
    }

    @Override
    public LotoPointDto convertToDto(LotoPoint entity) {
        return getMapper().convertToDto(entity);
    }
    @Override
    public List<LotoPoint> getByValue(Value val) {
        List<LotoPoint> result = new ArrayList<>();
        String cat = val.getCategory().getAlias();
        if(cat.equals("isoPos")) result.addAll(getByIsoPos(val));
        if(cat.equals("normPos")) result.addAll(getByNormPos(val));
        return result;
    }

    @Override
    public List<LotoPointDto> getByTagNumber(String tag) {
        return lotoPointRepo.findByTagNumber(tag).stream().map(this::convertToDto).toList();
    }

    @Override
    public List<LotoPointDtoLight> getAllLight() {
        return lotoPointRepo.getAllLight();
    }

    @Override
    public List<LotoPointDto> getByTagNumberInDescription(String tag) {
        return lotoPointRepo.findByDescriptionContaining(tag).stream().map(this::convertToDto).toList();
    }

    @Override
    public List<LotoPointDto> getActiveLotoPoints() {
        return lotoPointRepo.findByIsProcessed(true).stream().map(this::convertToDto).toList();
    }
    @Override
    public List<LotoPointDto> getActiveNotVerifiedLotoPoints() {
        return lotoPointRepo.findByEquipmentListNotNullAndIsUpdatedNull().stream().map(this::convertToDto).toList();
    }

    @Override
    public List<LotoPoint> getIfDescriptionContains(String tagNumber) {
        return lotoPointRepo.findByDescriptionContaining(tagNumber);
    }

    @Override
    public List<LotoPoint> getIfLocationContains(String tagNumber) {
        return lotoPointRepo.findBySpecificLocationContaining(tagNumber);
    }

    @Override
    public List<LotoPoint> getIfTagNumberContains(String tagNumber) {
        return lotoPointRepo.findByTagNumberContaining(tagNumber);
    }

    @Override
    public void refactor(Value old, Value _new) {
        String cat = old.getCategory().getAlias();
        for (LotoPoint f : getByValue(old)) {
            if(cat.equals("isoPos"))f.setIsoPos(_new);
            if(cat.equals("normPos"))f.setNormPos(_new);
            save(f);
        }
    }
}
