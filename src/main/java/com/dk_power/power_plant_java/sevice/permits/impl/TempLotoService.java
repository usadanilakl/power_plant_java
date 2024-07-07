package com.dk_power.power_plant_java.sevice.permits.impl;

import com.dk_power.power_plant_java.dto.permits.TempLotoDto;
import com.dk_power.power_plant_java.entities.permits.lotos.BaseLoto;
import com.dk_power.power_plant_java.entities.permits.lotos.TempLoto;
import com.dk_power.power_plant_java.entities.equipment.RevisedExcelPoints;
import com.dk_power.power_plant_java.mappers.BasePermitMapper;
import com.dk_power.power_plant_java.repository.permits.BasePermitRepo;
import com.dk_power.power_plant_java.repository.permits.loto_repo.TempLotoRepo;
import com.dk_power.power_plant_java.sevice.permits.PermitNumbersService;
import com.dk_power.power_plant_java.sevice.plant.impl.RevisedExcelPointsService;
import com.dk_power.power_plant_java.sevice.users.impl.UserDetailsServiceImpl;
import jakarta.persistence.EntityManagerFactory;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TempLotoService extends BasePermitServiceImpl<TempLoto, TempLotoDto>{
    private final TempLotoRepo tempLotoRepo;
    private final BasePermitMapper<TempLoto, TempLotoDto> permitMapper;
    private final RevisedExcelPointsService revisedExcelPointsService;

    public TempLotoService(
            BasePermitRepo<TempLoto> repository,
            PermitNumbersService permitNumbersService,
            FilterService<TempLoto> filterService,
            UserDetailsServiceImpl customUserDetails,
            BasePermitMapper<TempLoto, TempLotoDto> permitMapper,
            TempLotoRepo tempLotoRepo,
            EntityManagerFactory entityManagerFactory, RevisedExcelPointsService revisedExcelPointsService
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
        this.permitMapper = permitMapper;
        this.revisedExcelPointsService = revisedExcelPointsService;
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

    @Override
    public TempLoto save(TempLoto entity) {
        List<TempLoto> items = tempLotoRepo.findByCreatedBy(entity.getCreatedBy());
        if(items.isEmpty()) return tempLotoRepo.save(entity);
        else if(items.size()==1){
            if(items.getFirst().getId() != entity.getId()) entity.setId(items.getFirst().getId());
            return tempLotoRepo.save(entity);
        }else return null;

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

    public TempLoto saveTempLotoDto(TempLotoDto loto){
        TempLoto entity = permitMapper.convertToEntity(loto, TempLoto.class);
        if(entity.getLotoPoints()!=null){
            for (RevisedExcelPoints p : entity.getLotoPoints()) {
                p.addLoto(entity);
                //entity.addPoint(p);
                revisedExcelPointsService.save(p);
            }
        }
        else System.out.println("points are null");
        Long id = getTempPermit().getId();
        if(entity.getId()!=id) entity.setId(id);
        return save(entity);
    }
}
