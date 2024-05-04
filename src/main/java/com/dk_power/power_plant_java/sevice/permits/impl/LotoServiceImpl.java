package com.dk_power.power_plant_java.sevice.permits.impl;

import com.dk_power.power_plant_java.dto.permits.LotoDto;
import com.dk_power.power_plant_java.entities.permits.Loto;
import com.dk_power.power_plant_java.repository.permits.LotoTempRepo;
import com.dk_power.power_plant_java.repository.permits.LotoRepo;
import com.dk_power.power_plant_java.sevice.permits.LotoService;
import com.dk_power.power_plant_java.util.Util;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@AllArgsConstructor
@Transactional
public class LotoServiceImpl implements LotoService {
    private final LotoRepo lotoRepo;
    @PersistenceContext
    private final EntityManager entityManager;
    @Override
    public List<Loto> getAllLotos() {
        return Util.toList(lotoRepo.findAll());
    }

    @Override
    public Loto getLotoById(Long id) {
        return lotoRepo.findById(id).orElse(null);
    }

    @Override
    public Loto saveLoto(Loto loto) {
        lotoRepo.save(loto);
        return loto;
    }


}
