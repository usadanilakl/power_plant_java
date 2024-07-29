package com.dk_power.power_plant_java.sevice.equipment.impl;

import com.dk_power.power_plant_java.dto.equipment.HtPanelDto;
import com.dk_power.power_plant_java.entities.equipment.HtPanel;
import com.dk_power.power_plant_java.mappers.equipment.HtPanelMapper;
import com.dk_power.power_plant_java.repository.equipment.HtPanelRepo;
import com.dk_power.power_plant_java.sevice.equipment.HtPanelService;
import org.hibernate.SessionFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class HtPanelServiceImpl implements HtPanelService {
    private final HtPanelRepo htPanelRepo;
    private final HtPanelMapper htPanelMapper;
    private final SessionFactory sessionFactory;

    public HtPanelServiceImpl(HtPanelRepo htPanelRepo, HtPanelMapper htPanelMapper, SessionFactory sessionFactory) {
        this.htPanelRepo = htPanelRepo;
        this.htPanelMapper = htPanelMapper;
        this.sessionFactory = sessionFactory;
    }

    @Override
    public HtPanel getEntity() {
        return new HtPanel();
    }

    @Override
    public HtPanelDto getDto() {
        return new HtPanelDto();
    }

    @Override
    public HtPanelRepo getRepo() {
        return htPanelRepo;
    }

    @Override
    public HtPanelMapper getMapper() {
        return htPanelMapper;
    }

    @Override
    public SessionFactory getSessionFactory() {
        return sessionFactory;
    }

    @Override
    public HtPanel getByTagNumber(String panel) {
        return htPanelRepo.findByTagNumber(panel);
    }
}
