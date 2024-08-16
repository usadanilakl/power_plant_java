package com.dk_power.power_plant_java.sevice.data_transfer.excel.impl;

import com.dk_power.power_plant_java.dto.data_transfer.HrsgValveDto;
import com.dk_power.power_plant_java.entities.data_transfer.HrsgValve;
import com.dk_power.power_plant_java.mappers.UniversalMapper;
import com.dk_power.power_plant_java.repository.data_transfer.HrsgValveRepo;
import com.dk_power.power_plant_java.sevice.data_transfer.excel.ExcelService;
import com.dk_power.power_plant_java.sevice.data_transfer.excel.HrsgValveService;
import org.hibernate.SessionFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class HrsgValveServiceImpl implements HrsgValveService {

    private final UniversalMapper universalMapper;
    private final HrsgValveRepo hrsgValveRepo;
    private final ExcelService excelService;
    private final SessionFactory sessionFactory;

    public HrsgValveServiceImpl(UniversalMapper universalMapper, HrsgValveRepo hrsgValveRepo, @Qualifier("HrsgValve")ExcelService excelService, SessionFactory sessionFactory) {
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

            data.setTagNumber(map.containsKey("Item Tag") ? (String) map.get("Item Tag") : null);
            data.setDesignation(map.containsKey("Designation") ? (String) map.get("Designation") : null);
            data.setInletPipeTag(map.containsKey("Inlet Pipe Tag") ? (String) map.get("Inlet Pipe Tag") : null);
            data.setOutletPipeTag(map.containsKey("Outlet Pipe Tag") ? (String) map.get("Outlet Pipe Tag") : null);
            data.setFluid(map.containsKey("Fluid") ? (String) map.get("Fluid") : null);
            data.setActType(map.containsKey("Act Type (Note 1)") ? (String) map.get("Act Type (Note 1)") : null);
            data.setFailSafePosition(map.containsKey("Fail safe position (Note 2)") ? (String) map.get("Fail safe position (Note 2)") : null);
            data.setNominalPipeSizeIn(map.containsKey("Nominal Pipe Size In (Inch)") ? (String) map.get("Nominal Pipe Size In (Inch)") : null);
            data.setNominalPipeSizeOut(map.containsKey("Nominal Pipe Size Out (Inch)") ? (String) map.get("Nominal Pipe Size Out (Inch)") : null);
            data.setValveType(map.containsKey("Valve Type") ? (String) map.get("Valve Type") : null);
            data.setPipeMaterialIn(map.containsKey("Pipe Material In") ? (String) map.get("Pipe Material In") : null);
            data.setPipeMaterialOut(map.containsKey("Pipe Material Out") ? (String) map.get("Pipe Material Out") : null);
            data.setVlvMaterial(map.containsKey("Vlv Material") ? (String) map.get("Vlv Material") : null);
            data.setMawpPsig(map.containsKey("MAWP [psig]") ? (String) map.get("MAWP [psig]") : null);
            data.setDesignTempF(map.containsKey("Design Temp. [°F]") ? (String) map.get("Design Temp. [°F]") : null);
            data.setMawpBarg(map.containsKey("MAWP [barg]") ? (String) map.get("MAWP [barg]") : null);
            data.setDesignTempC(map.containsKey("Design Temp. [°C]") ? (String) map.get("Design Temp. [°C]") : null);
            data.setValveClassIn(map.containsKey("Valve Class In") ? (String) map.get("Valve Class In") : null);
            data.setValveClassOut(map.containsKey("Valve Class Out") ? (String) map.get("Valve Class Out") : null);
            data.setPipeEndIn(map.containsKey("Pipe End In") ? (String) map.get("Pipe End In") : null);
            data.setPipeEndOut(map.containsKey("Pipe End Out") ? (String) map.get("Pipe End Out") : null);
            data.setRemarks(map.containsKey("Remarks") ? (String) map.get("Remarks") : null);
            data.setHydrotestPressurePsig(map.containsKey("Hydrotest Pressure [psig]") ? (String) map.get("Hydrotest Pressure [psig]") : null);
            data.setHydrotestPressureBarg(map.containsKey("Hydrotest Pressure [barg]") ? (String) map.get("Hydrotest Pressure [barg]") : null);
            data.setHydrotestNumber(map.containsKey("Hydrotest Number") ? (String) map.get("Hydrotest Number") : null);
            data.setCavityOverPressureProtection(map.containsKey("Cavity Over Pressure Protection (NOTE 3)") ? (String) map.get("Cavity Over Pressure Protection (NOTE 3)") : null);
            data.setSupplier(map.containsKey("Supplier") ? (String) map.get("Supplier") : null);
            data.setJohnCockerillValveDrawingNumber(map.containsKey("John Cockerill Valve Drawing Number") ? (String) map.get("John Cockerill Valve Drawing Number") : null);
            data.setWbsNumber(map.containsKey("WBS Number") ? (String) map.get("WBS Number") : null);
            data.setOriginalId(map.containsKey("Original ID") ? (String) map.get("Original ID") : null);
            data.setPid(map.containsKey("John Cockerill PID Number") ? (String) map.get("John Cockerill PID Number") : null);

            dataList.add(data);
            hrsgValveRepo.save(data);
        }

        return dataList;
    }

    @Override
    public List<HrsgValve> transferExcelToDB() {
        List<HrsgValve> dataList = new ArrayList<>();

        for (Map<String, String> map : excelService.getDataList()) {
            HrsgValve data = new HrsgValve();

            data.setTagNumber( map.get("Item Tag"));
            data.setDesignation( map.get("Designation"));
            data.setInletPipeTag( map.get("Inlet Pipe Tag"));
            data.setOutletPipeTag( map.get("Outlet Pipe Tag"));
            data.setFluid( map.get("Fluid"));
            data.setActType( map.get("Act Type (Note 1)"));
            data.setFailSafePosition( map.get("Fail safe position (Note 2)"));
            data.setNominalPipeSizeIn( map.get("Nominal Pipe Size In (Inch)"));
            data.setNominalPipeSizeOut( map.get("Nominal Pipe Size Out (Inch)"));
            data.setValveType( map.get("Valve Type"));
            data.setPipeMaterialIn( map.get("Pipe Material In"));
            data.setPipeMaterialOut( map.get("Pipe Material Out"));
            data.setVlvMaterial( map.get("Vlv Material"));
            data.setMawpPsig( map.get("MAWP [psig]"));
            data.setDesignTempF( map.get("Design Temp. [°F]"));
            data.setMawpBarg( map.get("MAWP [barg]"));
            data.setDesignTempC( map.get("Design Temp. [°C]"));
            data.setValveClassIn( map.get("Valve Class In"));
            data.setValveClassOut( map.get("Valve Class Out"));
            data.setPipeEndIn( map.get("Pipe End In"));
            data.setPipeEndOut( map.get("Pipe End Out"));
            data.setRemarks( map.get("Remarks"));
            data.setHydrotestPressurePsig( map.get("Hydrotest Pressure [psig]"));
            data.setHydrotestPressureBarg( map.get("Hydrotest Pressure [barg]"));
            data.setHydrotestNumber( map.get("Hydrotest Number"));
            data.setCavityOverPressureProtection( map.get("Cavity Over Pressure Protection (NOTE 3)"));
            data.setSupplier( map.get("Supplier"));
            data.setJohnCockerillValveDrawingNumber( map.get("John Cockerill Valve Drawing Number"));
            data.setWbsNumber( map.get("WBS Number"));
            data.setOriginalId( map.get("Original ID"));
            data.setPid( map.get("John Cockerill PID Number"));

            dataList.add(data);
            hrsgValveRepo.save(data);
        }

        return dataList;
    }
}
