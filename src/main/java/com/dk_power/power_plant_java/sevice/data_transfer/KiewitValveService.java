package com.dk_power.power_plant_java.sevice.data_transfer;

import com.dk_power.power_plant_java.dto.data_transfer.KiewitPipeIsoDto;
import com.dk_power.power_plant_java.dto.data_transfer.KiewitValveDto;
import com.dk_power.power_plant_java.entities.data_transfer.KiewitPipeIso;
import com.dk_power.power_plant_java.entities.data_transfer.KiewitValve;
import com.dk_power.power_plant_java.mappers.UniversalMapper;
import com.dk_power.power_plant_java.repository.data_transfer.KiewitPipeIsoRepo;
import com.dk_power.power_plant_java.repository.data_transfer.KiewitValveRepo;
import com.dk_power.power_plant_java.sevice.base_services.CrudService;
import lombok.AllArgsConstructor;
import org.hibernate.SessionFactory;
import org.springframework.stereotype.Service;

@Service
@AllArgsConstructor
public class KiewitValveService implements CrudService<KiewitValve, KiewitValveDto, KiewitValveRepo, UniversalMapper> {

    private final UniversalMapper universalMapper;
    private final KiewitValveRepo kiewitValveRepo;
    private final ExcelService excelService;
    private final SessionFactory sessionFactory;
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
}
