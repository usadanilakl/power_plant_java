package com.dk_power.power_plant_java.sevice.permits.impl;

import com.dk_power.power_plant_java.dto.permits.BaseLotoDto;
import com.dk_power.power_plant_java.entities.permits.lotos.BaseLoto;
import com.dk_power.power_plant_java.mappers.BasePermitMapper;
import com.dk_power.power_plant_java.repository.permits.BasePermitRepo;
import com.dk_power.power_plant_java.repository.permits.loto_repo.BaseLotoRepo;
import com.dk_power.power_plant_java.sevice.permits.PermitNumbersService;
import com.dk_power.power_plant_java.sevice.users.impl.UserDetailsServiceImpl;
import jakarta.persistence.EntityManagerFactory;
import org.springframework.stereotype.Service;

@Service
public class BaseLotoService extends BasePermitServiceImpl<BaseLoto, BaseLotoDto>{
    private final BaseLotoRepo baseLotoRepo;

    public BaseLotoService(
            BasePermitRepo<BaseLoto> repository,
            PermitNumbersService permitNumbersService,
            FilterService<BaseLoto> filterService,
            UserDetailsServiceImpl customUserDetails,
            BasePermitMapper<BaseLoto, BaseLotoDto> permitMapper,
            BaseLotoRepo baseLotoRepo,
            EntityManagerFactory entityManagerFactory
    ) {
        super(
                repository,
                permitNumbersService,
                filterService,
                customUserDetails,
                permitMapper,
                entityManagerFactory
        );
        this.baseLotoRepo = baseLotoRepo;
    }


    @Override
    public BaseLoto getTempPermit() {
        BaseLoto loto = baseLotoRepo.getTempPermit(getLoggedInUserName());
        if(loto==null){
            loto = new BaseLoto();
            baseLotoRepo.save(loto);
        }
        return loto;
    }

    public BaseLoto saveTempLoto(BaseLoto loto){
        BaseLoto bLoto = getTempPermit();
        if(bLoto!=null){
            bLoto.copy(loto);
            baseLotoRepo.save(bLoto);
            return bLoto;
        }
        baseLotoRepo.save(loto);
        return loto;
    }

    @Override
    public BaseLoto resetFields() {
        BaseLoto baseLoto = getTempPermit();
        baseLoto.copy(new BaseLoto());
        return saveTempLoto(baseLoto);
    }
}
