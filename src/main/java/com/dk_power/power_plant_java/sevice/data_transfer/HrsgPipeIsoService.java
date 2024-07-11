package com.dk_power.power_plant_java.sevice.data_transfer;

import com.dk_power.power_plant_java.dto.data_transfer.HrsgPipeIsoDto;
import com.dk_power.power_plant_java.entities.data_transfer.HrsgPipeIso;
import com.dk_power.power_plant_java.mappers.UniversalMapper;
import com.dk_power.power_plant_java.repository.data_transfer.HrsgPipeIsoRepo;
import com.dk_power.power_plant_java.sevice.base_services.CrudService;
import lombok.AllArgsConstructor;
import org.hibernate.SessionFactory;
import org.springframework.stereotype.Service;

@Service
@AllArgsConstructor
public class HrsgPipeIsoService implements CrudService<HrsgPipeIso, HrsgPipeIsoDto, HrsgPipeIsoRepo, UniversalMapper> {

    private final UniversalMapper universalMapper;
    private final HrsgPipeIsoRepo hrsgPipeIsoRepo;
    private final ExcelService excelService;
    private final SessionFactory sessionFactory;
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
}
