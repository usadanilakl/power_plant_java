package com.dk_power.power_plant_java.sevice.loto;

import com.dk_power.power_plant_java.dto.permits.LotoBoxDto;
import com.dk_power.power_plant_java.entities.loto.LotoBox;
import com.dk_power.power_plant_java.entities.loto.Loto;
import com.dk_power.power_plant_java.mappers.UniversalMapper;
import com.dk_power.power_plant_java.repository.loto.LotoBoxRepo;
import com.dk_power.power_plant_java.sevice.angular.NgValueService;
import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import org.hibernate.SessionFactory;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@AllArgsConstructor
@Transactional
public class BoxServiceImpl implements BoxService {
    private final LotoBoxRepo lotoBoxRepo;
    private final LotoService lotoService;
    private final UniversalMapper universalMapper;
    private final SessionFactory sessionFactory;
    private final NgValueService ngValueService;
    @Override
    public List<LotoBox> getAllBoxes() {
        return lotoBoxRepo.findAll();
    }

    @Override
    public List<LotoBox> getEmptyBoxes() {
        return List.of();
    }

    @Override
    public void addNewBox() {
        Integer number = lotoBoxRepo.getMaxNumber();
        if(number == null) number=1;
        else number++;
        System.out.println(number);
        LotoBox lotoBox = new LotoBox();
        lotoBox.setNumber(number);
        changeBoxStatus(lotoBox);
        lotoBoxRepo.save(lotoBox);
    }
    @Override
    public LotoBox getEmptyBox() {
        return null;
    }
    @Override
    public void changeBoxStatus(LotoBox lotoBox) {
            lotoBox.setLotoAccessoryStatus(ngValueService.createValue("LOTO Accessory Status", "Available"));
    }
    @Override
    public LotoBox assignLoto(Loto loto) {
        LotoBox lotoBox = getEmptyBox();
        loto.setLotoBox(lotoBox);
        changeBoxStatus(lotoBox);
        lotoBoxRepo.save(lotoBox);
        lotoService.save(loto);
        return lotoBox;
    }

    @Override
    public void resetLoto(LotoBox lotoBox) {
        changeBoxStatus(lotoBox);
    }

    @Override
    public LotoBoxDto getBoxDtoById(Long id) {
        LotoBox lotoBox = lotoBoxRepo.findById(id).orElse(null);
        return universalMapper.convert(lotoBox,new LotoBoxDto());
    }

    @Override
    public LotoBoxDto getBoxDtoByNumber(String number) {
        LotoBox lotoBox = lotoBoxRepo.findByNumber(Integer.parseInt(number));
        return universalMapper.convert(lotoBox,new LotoBoxDto());
    }

    @Override
    public LotoBox getBoxById(Long id) {
        return lotoBoxRepo.findById(id).orElse(null);
    }

    @Override
    public LotoBox saveBox(LotoBox lotoBox) {
        return lotoBoxRepo.save(lotoBox);
    }

    @Override
    public void assignBoxAndLoto(LotoBox lotoBox, Loto loto) {
        loto.setLotoBox(lotoBox);
        changeBoxStatus(lotoBox);
        lotoBoxRepo.save(lotoBox);
        lotoService.save(loto);
    }

    @Override
    public LotoBox getEntity() {
        return new LotoBox();
    }

    @Override
    public LotoBoxDto getDto() {
        return new LotoBoxDto();
    }

    @Override
    public LotoBoxRepo getRepo() {
        return lotoBoxRepo;
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
