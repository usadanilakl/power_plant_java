package com.dk_power.power_plant_java.sevice.permits.impl;

import com.dk_power.power_plant_java.dto.permits.LotoDto;
import com.dk_power.power_plant_java.entities2.loto.Loto;
import com.dk_power.power_plant_java.entities.equipment.RevisedExcelPoints;
import com.dk_power.power_plant_java.mappers.BasePermitMapper;
import com.dk_power.power_plant_java.repository.permits.BasePermitRepo;
import com.dk_power.power_plant_java.repository.loto.LotoRepo;
import com.dk_power.power_plant_java.sevice.permits.PermitNumbersService;
import com.dk_power.power_plant_java.sevice.plant.impl.RevisedExcelPointsService;
import com.dk_power.power_plant_java.sevice.users.impl.UserDetailsServiceImpl;
import jakarta.persistence.EntityManagerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

@Service
public class LotoService extends BasePermitServiceImpl<Loto, LotoDto>{
    private final LotoRepo lotoRepo;
    private final BasePermitMapper<Loto, LotoDto> permitMapper;
    private final RevisedExcelPointsService revisedExcelPointsService;


    public LotoService(
            @Qualifier("lotoRepo") BasePermitRepo<Loto> repository,
            PermitNumbersService permitNumbersService,
            FilterService<Loto> filterService,
            UserDetailsServiceImpl customUserDetails,
            BasePermitMapper<Loto, LotoDto> permitMapper,
            LotoRepo lotoRepo,
            EntityManagerFactory entityManagerFactory,
            RevisedExcelPointsService revisedExcelPointsService
    ) {
        super(repository, permitNumbersService, filterService, customUserDetails, permitMapper,entityManagerFactory);
        this.lotoRepo = lotoRepo;
        this.permitMapper = permitMapper;
        this.revisedExcelPointsService = revisedExcelPointsService;
    }

    @Override
    public LotoDto getDtoById(String ID) {
        Loto lot = lotoRepo.findById(Long.parseLong(ID)).orElse(null);
        return convertToDto(lot,LotoDto.class);
    }

    public Loto saveLotoDto(LotoDto loto){
        Loto entity = permitMapper.convertToEntity(loto, Loto.class);
        if(entity.getLotoPoints()!=null){
            for (RevisedExcelPoints p : entity.getLotoPoints()) {
                p.addPermLoto(entity);
                //entity.addPoint(p);
                revisedExcelPointsService.save(p);
            }
        }
        else System.out.println("points are null");
        return save(entity);
    }
}

