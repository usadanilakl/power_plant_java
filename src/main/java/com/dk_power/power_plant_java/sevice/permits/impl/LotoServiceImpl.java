package com.dk_power.power_plant_java.sevice.permits.impl;

import com.dk_power.power_plant_java.dto.permits.LotoDto;
import com.dk_power.power_plant_java.entities.permits.Loto;
import com.dk_power.power_plant_java.enums.PermitTypes;
import com.dk_power.power_plant_java.enums.Status;
import com.dk_power.power_plant_java.repository.permits.LotoTempRepo;
import com.dk_power.power_plant_java.repository.permits.LotoRepo;
import com.dk_power.power_plant_java.sevice.permits.LotoDtoService;
import com.dk_power.power_plant_java.sevice.permits.LotoService;
import com.dk_power.power_plant_java.sevice.permits.PermitNumbersService;
import com.dk_power.power_plant_java.util.Util;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.AllArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@AllArgsConstructor
@Transactional
public class LotoServiceImpl implements LotoService {
    private final LotoRepo lotoRepo;
    private final LotoDtoService lotoDtoService;
    private final PermitNumbersService permitNumbersService;
    @PersistenceContext
    private final EntityManager entityManager;
    @Override
    public List<Loto> getAllLotos() {
        return Util.toList(lotoRepo.findAll());
    }

    @Override
    public List<Loto> getAllSorted(Sort column) {
        return lotoRepo.findAll(column);
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

    @Override
    public Loto createNewLoto(LotoDto loto) {
        Loto entity = lotoDtoService.toEntity(loto);
        entity.setLotoNum(permitNumbersService.getNumber(PermitTypes.LOTO));
        entity.setStatus(Status.INCATCIVE);
        return saveLoto(entity);
    }

    @Override
    public Loto changeStatus(Long id, Status status) {
        Loto loto = getLotoById(id);
        loto.setStatus(status);
        return loto;
    }


}
