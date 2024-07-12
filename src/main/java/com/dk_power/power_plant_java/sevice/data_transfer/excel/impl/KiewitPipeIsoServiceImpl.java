package com.dk_power.power_plant_java.sevice.data_transfer.excel.impl;

import com.dk_power.power_plant_java.dto.data_transfer.KiewitPipeIsoDto;
import com.dk_power.power_plant_java.entities.data_transfer.KiewitPipeIso;
import com.dk_power.power_plant_java.mappers.UniversalMapper;
import com.dk_power.power_plant_java.repository.data_transfer.KiewitPipeIsoRepo;
import com.dk_power.power_plant_java.sevice.data_transfer.excel.ExcelService;
import com.dk_power.power_plant_java.sevice.data_transfer.excel.KiewitPipeIsoService;
import org.hibernate.SessionFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class KiewitPipeIsoServiceImpl implements KiewitPipeIsoService {

    private final UniversalMapper universalMapper;
    private final KiewitPipeIsoRepo kiewitPipeIsoRepo;
    private final ExcelService excelService;
    private final SessionFactory sessionFactory;

    public KiewitPipeIsoServiceImpl(UniversalMapper universalMapper, KiewitPipeIsoRepo kiewitPipeIsoRepo, @Qualifier("KiewitPipe") ExcelService excelService, SessionFactory sessionFactory) {
        this.universalMapper = universalMapper;
        this.kiewitPipeIsoRepo = kiewitPipeIsoRepo;
        this.excelService = excelService;
        this.sessionFactory = sessionFactory;
    }

    @Override
    public KiewitPipeIso getEntity() {
        return new KiewitPipeIso();
    }

    @Override
    public KiewitPipeIsoDto getDto() {
        return new KiewitPipeIsoDto();
    }

    @Override
    public KiewitPipeIsoRepo getRepo() {
        return kiewitPipeIsoRepo;
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
    public List<KiewitPipeIso> transferExcelToPojo() {
        List<KiewitPipeIso> dataList = new ArrayList<>();

        for (Map<String, String> map : excelService.getDataList()) {
            KiewitPipeIso data = new KiewitPipeIso();

            data.setLineNumber(Integer.valueOf(map.get("Line Number")));
            data.setDescription(map.get("Description"));
            data.setSortableSize(Boolean.valueOf(map.get("Sortable Size")));
            data.setSystem(map.get("System"));
            data.setPipeSpec(map.get("Pipe Spec"));
            data.setWorkingFluid(map.get("Working Fluid"));
            data.setUnit(map.get("Unit"));
            data.setDesignPressPsig(Double.valueOf(map.get("Design Press Psig")));
            data.setDesignTempF(Double.valueOf(map.get("Design Temp F")));
            data.setSchedule(map.get("Schedule"));
            data.setMaxOpPressPsig(Double.valueOf(map.get("Max Op Press Psig")));
            data.setNormOpPressPsig(Double.valueOf(map.get("Norm Op Press Psig")));
            data.setMinOpPressPsig(Double.valueOf(map.get("Min Op Press Psig")));
            data.setTestPressPsig(Double.valueOf(map.get("Test Press Psig")));
            data.setTestMedium(map.get("Test Medium"));
            data.setMaxOpTempF(Double.valueOf(map.get("Max Op Temp F")));
            data.setNormOpTempF(Double.valueOf(map.get("Norm Op Temp F")));
            data.setMinOpTempF(Double.valueOf(map.get("Min Op Temp F")));
            data.setInsulationSpec(map.get("Insulation Spec"));
            data.setInsulationThickness(Double.valueOf(map.get("Insulation Thickness")));
            data.setHeatTraced(Boolean.valueOf(map.get("Heat Traced")));
            data.setCathodicProtection(Boolean.valueOf(map.get("Cathodic Protection")));
            data.setComments(map.get("Comments"));
            data.setPurchaseSpec(map.get("Purchase Spec"));
            data.setOriginalId(map.get("Original ID"));
            data.setPAndId(map.get("P and ID"));

            dataList.add(data);
            kiewitPipeIsoRepo.save(data);
        }

        return dataList;
    }
}
