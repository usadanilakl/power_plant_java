package com.dk_power.power_plant_java.sevice.equipment;

import com.dk_power.power_plant_java.dto.equipment.LotoPointDto;
import com.dk_power.power_plant_java.entities.equipment.LotoPoint;
import com.dk_power.power_plant_java.mappers.UniversalMapper;
import com.dk_power.power_plant_java.repository.loto.LotoPointRepo;
import lombok.AllArgsConstructor;
import org.hibernate.SessionFactory;
import org.springframework.stereotype.Service;

@Service
@AllArgsConstructor
public class LotoPointServiceImpl implements LotoPointService{
    private final LotoPointRepo lotoPointRepo;
    private final SessionFactory sessionFactory;
    private final UniversalMapper universalMapper;
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
    public UniversalMapper getMapper() {
        return universalMapper;
    }

    @Override
    public SessionFactory getSessionFactory() {
        return sessionFactory;
    }
}
