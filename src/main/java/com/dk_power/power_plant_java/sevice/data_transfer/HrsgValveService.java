package com.dk_power.power_plant_java.sevice.data_transfer;

import com.dk_power.power_plant_java.dto.data_transfer.HrsgValveDto;
import com.dk_power.power_plant_java.dto.data_transfer.KiewitValveDto;
import com.dk_power.power_plant_java.entities.data_transfer.HrsgValve;
import com.dk_power.power_plant_java.entities.data_transfer.KiewitValve;
import com.dk_power.power_plant_java.mappers.UniversalMapper;
import com.dk_power.power_plant_java.repository.data_transfer.HrsgValveRepo;
import com.dk_power.power_plant_java.repository.data_transfer.KiewitValveRepo;
import com.dk_power.power_plant_java.sevice.base_services.CrudService;
import lombok.AllArgsConstructor;
import org.hibernate.SessionFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class HrsgValveService implements CrudService<HrsgValve, HrsgValveDto, HrsgValveRepo, UniversalMapper> {

    private final UniversalMapper universalMapper;
    private final HrsgValveRepo hrsgValveRepo;
    private final ExcelService excelService;
    private final SessionFactory sessionFactory;

    public HrsgValveService(UniversalMapper universalMapper, HrsgValveRepo hrsgValveRepo, @Qualifier("HrsgValve")ExcelService excelService, SessionFactory sessionFactory) {
        this.universalMapper = universalMapper;
        this.hrsgValveRepo = hrsgValveRepo;
        this.excelService = excelService;
        this.sessionFactory = sessionFactory;
    }

    @Override
    public HrsgValve getEntity() {
        return new HrsgValve();
    }

    @Override
    public HrsgValveDto getDto() {
        return new HrsgValveDto();
    }

    @Override
    public HrsgValveRepo getRepo() {
        return hrsgValveRepo;
    }

    @Override
    public UniversalMapper getMapper() {
        return universalMapper;
    }

    @Override
    public SessionFactory getSessionFactory() {
        return sessionFactory;
    }

    public List<HrsgValve> transferExcelToDb() {
        List<Map<String, Object>> listOfMaps = excelService.getDataListObject();
        List<HrsgValve> dataList = new ArrayList<>();

        for (Map<String, Object> map : listOfMaps) {
            HrsgValve data = new HrsgValve();

            data.setItemTag((String) map.get("Item Tag"));
            data.setDesignation((String) map.get("Designation"));
            data.setInletPipeTag((String) map.get("Inlet Pipe Tag"));
            data.setOutletPipeTag((String) map.get("Outlet Pipe Tag"));
            data.setFluid((String) map.get("Fluid"));
            data.setActType((String) map.get("Act Type (Note 1)"));
            data.setFailSafePosition((String) map.get("Fail safe position (Note 2)"));
            data.setNominalPipeSizeIn((String) map.get("Nominal Pipe Size In (Inch)"));
            data.setNominalPipeSizeOut((String) map.get("Nominal Pipe Size Out (Inch)"));
            data.setValveType((String) map.get("Valve Type"));
            data.setPipeMaterialIn((String) map.get("Pipe Material In"));
            data.setPipeMaterialOut((String) map.get("Pipe Material Out"));
            data.setVlvMaterial((String) map.get("Vlv Material"));
            data.setMawpPsig((Double) map.get("MAWP [psig]"));
            data.setDesignTempF((Double) map.get("Design Temp. [°F]"));
            data.setMawpBarg((Double) map.get("MAWP [barg]"));
            data.setDesignTempC((Double) map.get("Design Temp. [°C]"));
            data.setValveClassIn((String) map.get("Valve Class In"));
            data.setValveClassOut((String) map.get("Valve Class Out"));
            data.setPipeEndIn((String) map.get("Pipe End In"));
            data.setPipeEndOut((String) map.get("Pipe End Out"));
            data.setRemarks((String) map.get("Remarks"));
            data.setHydrotestPressurePsig((Double) map.get("Hydrotest Pressure [psig]"));
            data.setHydrotestPressureBarg((Double) map.get("Hydrotest Pressure [barg]"));
            data.setHydrotestNumber((String) map.get("Hydrotest Number"));
            data.setCavityOverPressureProtection((String) map.get("Cavity Over Pressure Protection (NOTE 3)"));
            data.setSupplier((String) map.get("Supplier"));
            data.setJohnCockerillValveDrawingNumber((String) map.get("John Cockerill Valve Drawing Number"));
            data.setWbsNumber((String) map.get("WBS Number"));
            data.setOriginalId((String) map.get("Original ID"));
            data.setJohnCockerillPidNumber((String) map.get("John Cockerill PID Number"));

            dataList.add(data);
            hrsgValveRepo.save(data);
        }

        return dataList;
    }

}
