package com.dk_power.power_plant_java.sevice.permits.impl;

import com.dk_power.power_plant_java.dto.permits.BaseLotoDto;
import com.dk_power.power_plant_java.dto.permits.TempLotoDto;
import com.dk_power.power_plant_java.entities.permits.lotos.BaseLoto;
import com.dk_power.power_plant_java.entities.permits.lotos.TempLoto;
import com.dk_power.power_plant_java.mappers.BasePermitMapper;
import com.dk_power.power_plant_java.repository.permits.BasePermitRepo;
import com.dk_power.power_plant_java.repository.permits.loto_repo.BaseLotoRepo;
import com.dk_power.power_plant_java.repository.permits.loto_repo.TempLotoRepo;
import com.dk_power.power_plant_java.sevice.permits.PermitNumbersService;
import com.dk_power.power_plant_java.sevice.users.impl.UserDetailsServiceImpl;
import jakarta.persistence.EntityManagerFactory;
import org.springframework.stereotype.Service;

@Service
public class TempLotoService extends BasePermitServiceImpl<TempLoto, TempLotoDto>{
    private final TempLotoRepo tempLotoRepo;

    public TempLotoService(
            BasePermitRepo<TempLoto> repository,
            PermitNumbersService permitNumbersService,
            FilterService<TempLoto> filterService,
            UserDetailsServiceImpl customUserDetails,
            BasePermitMapper<TempLoto, TempLotoDto> permitMapper,
            TempLotoRepo tempLotoRepo,
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
        this.tempLotoRepo = tempLotoRepo;
    }


    @Override
    public TempLoto getTempPermit() {
        TempLoto loto = tempLotoRepo.getTempPermit(getLoggedInUserName());
        if(loto==null){
            loto = new TempLoto();
            tempLotoRepo.save(loto);
        }
        return loto;
    }

    public TempLoto saveTempLoto(TempLoto loto){
        TempLoto bLoto = getTempPermit();
        if(bLoto!=null){
            bLoto.copy(loto);
            tempLotoRepo.save(bLoto);
            return bLoto;
        }
        tempLotoRepo.save(loto);
        return loto;
    }

    @Override
    public TempLoto resetFields() {
        TempLoto tLoto = getTempPermit();
        tLoto.copy(new BaseLoto());
        return saveTempLoto(tLoto);
    }
}
