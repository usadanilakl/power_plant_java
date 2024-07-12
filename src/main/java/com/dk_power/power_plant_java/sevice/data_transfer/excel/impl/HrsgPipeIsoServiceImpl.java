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

        for (Map<String, Object> map : excelService.getDataListObject()) {
            HrsgPipeIso data = new HrsgPipeIso();

            data.setRev((String) map.get("Rev"));
            data.setItemTag((String) map.get("Item Tag"));
            data.setLineTag((String) map.get("Line Tag"));
            data.setDesignation((String) map.get("Designation"));
            data.setPipeSpec((String) map.get("Pipe Spec"));
            data.setNominalSizeInch((Double) map.get("Nominal size [Inch]"));
            data.setOutsideDiameterInch((Double) map.get("Outside Diameter OD [inch]"));
            data.setThicknessInch((Double) map.get("Thickness [inch]"));
            data.setNominalSizeMm((Double) map.get("Nominal Size [mm]"));
            data.setOutsideDiameterMm((Double) map.get("Outside Diameter OD [mm]"));
            data.setThicknessMm((Double) map.get("Thickness [mm]"));
            data.setSchedule((String) map.get("Schedule"));
            data.setPipeMaterial((String) map.get("Pipe Material"));
            data.setFluid((String) map.get("Fluid"));
            data.setDesignPressPsig((Double) map.get("Design Press. [psig]"));
            data.setDesignTempF((Double) map.get("Design Temp. [°F]"));
            data.setWorkPressPsig((Double) map.get("Work. Press. [psig]"));
            data.setWorkTempF((Double) map.get("Work. Temp. [°F]"));
            data.setMaxWorkTempF((Double) map.get("Max working Temp. [°F]"));
            data.setTempForInsulationF((Double) map.get("Temp. for insulation [°F]"));
            data.setDesignPressBarg((Double) map.get("Design Press. [barg]"));
            data.setDesignTempC((Double) map.get("Design Temp. [°C]"));
            data.setWorkPressBarg((Double) map.get("Work. Press. [barg]"));
            data.setWorkTempC((Double) map.get("Work. Temp. [°C]"));
            data.setMaxWorkTempC((Double) map.get("Max working Temp. [°C]"));
            data.setTempForInsulationC((Double) map.get("Temp. for insulation [°C]"));
            data.setInsulationType((String) map.get("Insulation Type"));
            data.setInsulationMaterial((String) map.get("Insulation Material"));
            data.setInsulationThicknessInch((Double) map.get("Insulation Thickness [inch] [Note 1]"));
            data.setInsulationThicknessMm((Double) map.get("Insulation Thickness [mm] [Note 1]"));
            data.setHeatTracing((Boolean) map.get("Heat Tracing"));
            data.setHydrotestCircuitNumber((String) map.get("Hydrotest Circuit Number (refer to 2080_89P02)"));
            data.setHydrotestPressurePsig((Double) map.get("Hydrotest pressure [psig]"));
            data.setHydrotestPressureBarg((Double) map.get("Hydrotest pressure [barg]"));
            data.setIsometricNumber((String) map.get("Isometric Numb"));
            data.setRemarks((String) map.get("Remarks"));
            data.setPidNumber((String) map.get("PID Number"));
            data.setLocationOnPid((String) map.get("Location on P&ID"));
            data.setOriginalId((String) map.get("Original ID"));

            dataList.add(data);
            hrsgPipeIsoRepo.save(data);
        }

        return dataList;
    }
}
