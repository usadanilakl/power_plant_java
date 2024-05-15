package com.dk_power.power_plant_java.sevice.permits.impl;

import com.dk_power.power_plant_java.dto.permits.BoxDto;
import com.dk_power.power_plant_java.entities.permits.lotos.Box;
import com.dk_power.power_plant_java.entities.permits.lotos.Loto;
import com.dk_power.power_plant_java.enums.Status;
import com.dk_power.power_plant_java.mappers.BaseItemMapper;
import com.dk_power.power_plant_java.repository.permits.loto_repo.BoxRepo;
import com.dk_power.power_plant_java.sevice.permits.BoxService;
import com.dk_power.power_plant_java.util.Util;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@AllArgsConstructor
public class BoxServiceImpl implements BoxService {
    private final BoxRepo boxRepo;
    private final BaseItemMapper<Box,BoxDto> itemMapper;
    @Override
    public List<Box> getAllBoxes() {
        return Util.toList(boxRepo.findAll());
    }
    @Override
    public List<Box> getEmptyBoxes() {
        return boxRepo.getEmptyBoxes().toList();
    }
    @Override
    public void addNewBox() {
        Integer number = boxRepo.getMaxNumber();
        if(number == null) number=1;
        else number++;
        System.out.println(number);
        Box box = new Box();
        box.setNumber(number);
        changeBoxStatus(box);
        boxRepo.save(box);
    }
    @Override
    public Box getEmptyBox() {
        return boxRepo.getEmptyBox();
    }
    @Override
    public void changeBoxStatus(Box box) {
        if(box.getLoto()==null){
            box.setStatus(Status.AVAILABLE);
        }else{
            box.setStatus(Status.IN_USE);
        }
    }
    @Override
    public void assignLoto(Loto loto) {
        Box box = getEmptyBox();
        box.setLoto(loto);
        changeBoxStatus(box);
    }

    @Override
    public void resetLoto(Box box) {
        box.setLoto(null);
        changeBoxStatus(box);
    }

    @Override
    public BoxDto getBoxDtoById(Long id) {
        Box box = boxRepo.findById(id).orElse(null);
        return itemMapper.convertToDto(box,BoxDto.class);
    }
}
