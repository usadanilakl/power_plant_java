package com.dk_power.power_plant_java.sevice.data_transfer;

import com.dk_power.power_plant_java.dto.data_transfer.HrsgPipeIsoDto;
import com.dk_power.power_plant_java.dto.data_transfer.KiewitPipeIsoDto;
import com.dk_power.power_plant_java.entities.data_transfer.HrsgPipeIso;
import com.dk_power.power_plant_java.entities.data_transfer.KiewitPipeIso;
import com.dk_power.power_plant_java.mappers.UniversalMapper;
import com.dk_power.power_plant_java.repository.data_transfer.HrsgPipeIsoRepo;
import com.dk_power.power_plant_java.repository.data_transfer.KiewitPipeIsoRepo;
import com.dk_power.power_plant_java.sevice.base_services.CrudService;
import lombok.AllArgsConstructor;
import org.hibernate.SessionFactory;
import org.springframework.stereotype.Service;

@Service
@AllArgsConstructor
public class KiewitPipeIsoService implements CrudService<KiewitPipeIso, KiewitPipeIsoDto, KiewitPipeIsoRepo, UniversalMapper> {

    private final UniversalMapper universalMapper;
    private final KiewitPipeIsoRepo kiewitPipeIsoRepo;
    private final ExcelService excelService;
    private final SessionFactory sessionFactory;
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
}
