package com.dk_power.power_plant_java.sevice.data_transfer.excel.impl;

import com.dk_power.power_plant_java.dto.data_transfer.KiewitValveDto;
import com.dk_power.power_plant_java.entities.data_transfer.KiewitValve;
import com.dk_power.power_plant_java.mappers.UniversalMapper;
import com.dk_power.power_plant_java.repository.data_transfer.KiewitValveRepo;
import com.dk_power.power_plant_java.sevice.base_services.CrudService;
import com.dk_power.power_plant_java.sevice.data_transfer.excel.ExcelService;
import com.dk_power.power_plant_java.sevice.data_transfer.excel.ExcelTransferService;
import com.dk_power.power_plant_java.sevice.data_transfer.excel.KiewitValveService;
import org.hibernate.SessionFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class KiewitValveServiceImpl implements KiewitValveService {

    private final UniversalMapper universalMapper;
    private final KiewitValveRepo kiewitValveRepo;
    private final ExcelService excelService;
    private final SessionFactory sessionFactory;

    public KiewitValveServiceImpl(UniversalMapper universalMapper, KiewitValveRepo kiewitValveRepo, @Qualifier("KiewitValve") ExcelService excelService, SessionFactory sessionFactory) {
        this.universalMapper = universalMapper;
        this.kiewitValveRepo = kiewitValveRepo;
        this.excelService = excelService;
        this.sessionFactory = sessionFactory;
    }

    @Override
    public KiewitValve getEntity() {
        return new KiewitValve();
    }

    @Override
    public KiewitValveDto getDto() {
        return new KiewitValveDto();
    }

    @Override
    public KiewitValveRepo getRepo() {
        return kiewitValveRepo;
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
    public List<KiewitValve> transferExcelToDB() {
        List<KiewitValve> dataList = new ArrayList<>();

        for (Map<String, Object> map : excelService.getDataListObject()) {
            KiewitValve data = new KiewitValve();

            data.setTagNumber((String) map.get("Tag Number"));
            data.setDescription((String) map.get("Description"));
            data.setLineNumber((Integer) map.get("Line Number"));
            data.setSizeIn((Double) map.get("Size (in)"));
            data.setValveType((String) map.get("Valve Type"));
            data.setSystem((String) map.get("System"));
            data.setPipeSpec((String) map.get("Pipe Spec"));
            data.setWorkingFluid((String) map.get("Working Fluid"));
            data.setRating((String) map.get("Rating"));
            data.setEndPrep1((String) map.get("End Prep1"));
            data.setEndPrep2((String) map.get("End Prep2"));
            data.setDesignPressPsig((Double) map.get("Design Press (psig)"));
            data.setDesignTempF((Double) map.get("Design Temp (F)"));
            data.setValveSchedule((String) map.get("Valve Schedule"));
            data.setInsulationThickness((Double) map.get("Insulation Thickness"));
            data.setHeatTraced((Boolean) map.get("Heat Traced"));
            data.setPurchaseSpec((String) map.get("Purchase Spec"));
            data.setComments((String) map.get("Comments"));
            data.setOriginalId((String) map.get("Original ID"));
            data.setPAndId((String) map.get("P&ID"));

            dataList.add(data);
            kiewitValveRepo.save(data);
        }

        return dataList;
    }
}
