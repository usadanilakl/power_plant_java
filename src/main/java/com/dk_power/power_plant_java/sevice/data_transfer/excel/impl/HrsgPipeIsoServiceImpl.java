package com.dk_power.power_plant_java.sevice.data_transfer.excel.impl;

import com.dk_power.power_plant_java.dto.data_transfer.HrsgPipeIsoDto;
import com.dk_power.power_plant_java.entities.data_transfer.HrsgPipeIso;
import com.dk_power.power_plant_java.mappers.UniversalMapper;
import com.dk_power.power_plant_java.repository.data_transfer.HrsgPipeIsoRepo;
import com.dk_power.power_plant_java.sevice.data_transfer.excel.ExcelService;
import com.dk_power.power_plant_java.sevice.data_transfer.excel.HrsgPipeIsoService;
import org.hibernate.SessionFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class HrsgPipeIsoServiceImpl implements HrsgPipeIsoService {

    private final UniversalMapper universalMapper;
    private final HrsgPipeIsoRepo hrsgPipeIsoRepo;
    private final ExcelService excelService;
    private final SessionFactory sessionFactory;

    public HrsgPipeIsoServiceImpl(UniversalMapper universalMapper, HrsgPipeIsoRepo hrsgPipeIsoRepo, @Qualifier("HrsgPipe") ExcelService excelService, SessionFactory sessionFactory) {
        this.universalMapper = universalMapper;
        this.hrsgPipeIsoRepo = hrsgPipeIsoRepo;
        this.excelService = excelService;
        this.sessionFactory = sessionFactory;
    }

    @Override
    public HrsgPipeIso getEntity() {
        return new HrsgPipeIso();
    }

    @Override
    public HrsgPipeIsoDto getDto() {
        return new HrsgPipeIsoDto();
    }

    @Override
    public HrsgPipeIsoRepo getRepo() {
        return hrsgPipeIsoRepo;
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
    public List<HrsgPipeIso> transferExcelToDB() {
        List<HrsgPipeIso> dataList = new ArrayList<>();

        for (Map<String, String> map : excelService.getDataList()) {
            HrsgPipeIso data = new HrsgPipeIso();

            data.setRev( map.get("Rev"));
            data.setItemTagNumber( map.get("Item Tag"));
            data.setTagNumber( map.get("Line Tag"));
            data.setDesignation( map.get("Designation"));
            data.setPipeSpec( map.get("Pipe Spec"));
            data.setNominalSizeInch( map.get("Nominal size [Inch]"));
            data.setOutsideDiameterInch( map.get("Outside Diameter OD [inch]"));
            data.setThicknessInch( map.get("Thickness [inch]"));
            data.setNominalSizeMm( map.get("Nominal Size [mm]"));
            data.setOutsideDiameterMm( map.get("Outside Diameter OD [mm]"));
            data.setThicknessMm( map.get("Thickness [mm]"));
            data.setSchedule( map.get("Schedule"));
            data.setPipeMaterial( map.get("Pipe Material"));
            data.setFluid( map.get("Fluid"));
            data.setDesignPressPsig( map.get("Design Press. [psig]"));
            data.setDesignTempF( map.get("Design Temp. [°F]"));
            data.setWorkPressPsig( map.get("Work. Press. [psig]"));
            data.setWorkTempF( map.get("Work. Temp. [°F]"));
            data.setMaxWorkTempF( map.get("Max working Temp. [°F]"));
            data.setTempForInsulationF( map.get("Temp. for insulation [°F]"));
            data.setDesignPressBarg( map.get("Design Press. [barg]"));
            data.setDesignTempC( map.get("Design Temp. [°C]"));
            data.setWorkPressBarg( map.get("Work. Press. [barg]"));
            data.setWorkTempC( map.get("Work. Temp. [°C]"));
            data.setMaxWorkTempC( map.get("Max working Temp. [°C]"));
            data.setTempForInsulationC( map.get("Temp. for insulation [°C]"));
            data.setInsulationType( map.get("Insulation Type"));
            data.setInsulationMaterial( map.get("Insulation Material"));
            data.setInsulationThicknessInch( map.get("Insulation Thickness [inch] [Note 1]") + " in");
            data.setInsulationThicknessMm( map.get("Insulation Thickness [mm] [Note 1]"));
            data.setHeatTracing(map.get("Heat Tracing"));
            data.setHydrotestCircuitNumber( map.get("Hydrotest Circuit Number (refer to 2080_89P02)"));
            data.setHydrotestPressurePsig( map.get("Hydrotest pressure [psig]"));
            data.setHydrotestPressureBarg( map.get("Hydrotest pressure [barg]"));
            data.setIsometricNumber( map.get("Isometric Numb"));
            data.setRemarks( map.get("Remarks"));
            data.setPid( map.get("PID Number"));
            data.setLocationOnPid( map.get("Location on P&ID"));
            data.setOriginalId( map.get("Original ID"));

            String th = data.getThicknessInch() + "in";
            data.setThicknessInch(th);

            dataList.add(data);
            hrsgPipeIsoRepo.save(data);

        }
        return dataList;
    }
}
