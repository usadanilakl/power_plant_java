package com.dk_power.power_plant_java.sevice.equipment.impl;

import com.dk_power.power_plant_java.dto.equipment.ElectricalPanelDto;
import com.dk_power.power_plant_java.entities.equipment.ElectricalPanel;
import com.dk_power.power_plant_java.entities.equipment.HtPanel;
import com.dk_power.power_plant_java.mappers.equipment.ElectricalPanelMapper;
import com.dk_power.power_plant_java.repository.equipment.ElectricalPanelRepo;
import com.dk_power.power_plant_java.sevice.equipment.ElectricalPanelService;
import org.hibernate.SessionFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class ElectricalPanelServiceImpl implements ElectricalPanelService {
    private final ElectricalPanelMapper electricalPanelMapper;
    private final ElectricalPanelRepo electricalPanelRepo;
    private final SessionFactory sessionFactory;

    public ElectricalPanelServiceImpl(ElectricalPanelMapper electricalPanelMapper, ElectricalPanelRepo electricalPanelRepo, SessionFactory sessionFactory) {
        this.electricalPanelMapper = electricalPanelMapper;
        this.electricalPanelRepo = electricalPanelRepo;
        this.sessionFactory = sessionFactory;
    }

    @Override
    public ElectricalPanel getEntity() {
        return new ElectricalPanel();
    }

    @Override
    public ElectricalPanelDto getDto() {
        return new ElectricalPanelDto();
    }

    @Override
    public ElectricalPanelRepo getRepo() {
        return electricalPanelRepo;
    }

    @Override
    public ElectricalPanelMapper getMapper() {
        return null;
    }

    @Override
    public SessionFactory getSessionFactory() {
        return sessionFactory;
    }

    @Override
    public ElectricalPanel getByTagNumber(String panel) {
        return electricalPanelRepo.findByTagNumber(panel);
    }

    @Override
    public void transferToDB(){
        String all = "00-LVB-PPL-173 TUB 1 \n" +
                "00-LVB-PPL-173 TUB 2\n" +
                "00-LVB-PPL-1731 \n" +
                "00-LVF-PPL-01\n" +
                "01-LVF-PPL-011\n" +
                "02-LVB-PPL-1211\n" +
                "01-LVB-PPL-1111\n" +
                "01-LVB-PPL-1112\n" +
                "01-LVB-PPL-11121\n" +
                "01-LVB-PPL-1113\n" +
                "01-LVB-PPL-1114\n" +
                "01-LVB-PPL-1115\n" +
                "01-LVB-PPL-1311\n" +
                "01-LVB-PPL-1511\n" +
                "01-LVB-PPL-2111\n" +
                "01-LVB-PPL-2112\n" +
                "01-LVB-PPL-2113\n" +
                "01-LVB-PPL-21132\n" +
                "01-LVB-PPL-21133\n" +
                "01-LVB-SWB-171 \n" +
                "01-LVB-SWB-2113\n" +
                "01-LVD-PPL-1111\n" +
                "01-LVD-PPL-1311\n" +
                "01-LVD-PPL-1712\n" +
                "01-LVD-PPL-1731 TUB 1 \n" +
                "01-LVD-PPL-1731 TUB 2 \n" +
                "01-LVD-PPL-1731 TUB 3 \n" +
                "01-LVD-PPL-2111\n" +
                "01-LVD-PPL-21111\n" +
                "01-LVD-PPL-21131\n" +
                "01-LVD-PPL-21133\n" +
                "01-LVD-PPL-2311\n" +
                "01-LVD-PPL-2511\n" +
                "01-LVE-PPL-01\n" +
                "01-LVE-PPL-012\n" +
                "01-LVF-PPL-01\n" +
                "01-LVF-PPL-012\n" +
                "01-LVF-PPL-013\n" +
                "01-LVF-PPL-014\n" +
                "01-LVF-PPL-015\n" +
                "02-LVB-PPL-2212\n" +
                "02-LVD-PPL-2211\n" +
                "02-LVB-PPL-1212\n" +
                "02-LVB-PPL-1213\n" +
                "02-LVB-PPL-1214\n" +
                "02-LVB-PPL-1215\n" +
                "02-LVB-PPL-1217 \n" +
                "02-LVB-PPL-1218\n" +
                "02-LVB-PPL-1411\n" +
                "02-LVB-PPL-1611\n" +
                "02-LVB-PPL-2211 TUB 1 \n" +
                "02-LVB-PPL-2211 TUB 2 \n" +
                "02-LVB-PPL-2211 TUB 3 \n" +
                "02-LVB-PPL-22112\n" +
                "02-LVB-PPL-22113\n" +
                "02-LVB-PPL-2213\n" +
                "02-LVB-PPL-22131\n" +
                "02-LVB-PPL-2214\n" +
                "02-LVB-PPL-2215\n" +
                "02-LVD-PPL-2216 \n" +
                "02-LVB-SWB-2211\n" +
                "02-LVB-SWB-271 \n" +
                "02-LVD-PPL-1211\n" +
                "02-LVD-PPL-12121\n" +
                "02-LVD-PPL-12151\n" +
                "02-LVD-PPL-12181\n" +
                "02-LVD-PPL-1412\n" +
                "02-LVD-PPL-2211 \n" +
                "02-LVD-PPL-22111\n" +
                "02-LVD-PPL-22113\n" +
                "02-LVD-PPL-22141\n" +
                "02-LVD-PPL-2411\n" +
                "02-LVD-PPL-2611\n" +
                "02-LVD-PPL-2712 \n" +
                "02-LVE-PPL-01\n" +
                "02-LVE-PPL-012\n" +
                "02-LVF-PPL-01\n" +
                "02-LVF-PPL-011\n" +
                "02-LVF-PPL-012\n" +
                "02-LVF-PPL-013\n" +
                "02-LVF-PPL-014\n" +
                "02-LVF-PPL-015\n";
        String [] arr = all.split("\n");
        for (String s : arr) {
            ElectricalPanel p = new ElectricalPanel();
            p.setTagNumber(s);
            save(p);
        }
    }

    @Override
    public ElectricalPanel convertToEntity(ElectricalPanelDto dto) {
        return getMapper().convertToEntity(dto);
    }

    @Override
    public ElectricalPanelDto convertToDto(ElectricalPanel entity) {
        return getMapper().convertToDto(entity);
    }
}
