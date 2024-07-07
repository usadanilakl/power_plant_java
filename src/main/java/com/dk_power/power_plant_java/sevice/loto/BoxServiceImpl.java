package com.dk_power.power_plant_java.sevice.loto;

import com.dk_power.power_plant_java.dto.permits.BoxDto;
import com.dk_power.power_plant_java.entities2.loto.Box;
import com.dk_power.power_plant_java.entities2.loto.Loto;
import com.dk_power.power_plant_java.enums.Status;
import com.dk_power.power_plant_java.mappers.BaseItemMapper;
import com.dk_power.power_plant_java.mappers.UniversalMapper;
import com.dk_power.power_plant_java.repository.loto.BoxRepo;
import com.dk_power.power_plant_java.repository.loto.LotoRepo;
import com.dk_power.power_plant_java.sevice.loto.BoxService;
import com.dk_power.power_plant_java.util.Util;
import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@AllArgsConstructor
@Transactional
public class BoxServiceImpl implements BoxService {
    private final BoxRepo boxRepo;
    private final LotoService lotoService;
    private final UniversalMapper universalMapper;
    @Override
    public List<Box> getAllBoxes() {
        return boxRepo.findAll();
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
    public Box assignLoto(Loto loto) {
        Box box = getEmptyBox();
        box.setLoto(loto);
        loto.setBox(box);
        changeBoxStatus(box);
        boxRepo.save(box);
        lotoService.saveEntity(loto);
        return box;
    }

    @Override
    public void resetLoto(Box box) {
        box.setLoto(null);
        changeBoxStatus(box);
    }

    @Override
    public BoxDto getBoxDtoById(Long id) {
        Box box = boxRepo.findById(id).orElse(null);
        return universalMapper.convert(box,new BoxDto());
    }

    @Override
    public BoxDto getBoxDtoByNumber(String number) {
        Box box = boxRepo.findByNumber(Integer.parseInt(number));
        return universalMapper.convert(box,new BoxDto());
    }

    @Override
    public Box getBoxById(Long id) {
        return boxRepo.findById(id).orElse(null);
    }

    @Override
    public Box saveBox(Box box) {
        return boxRepo.save(box);
    }

    @Override
    public void assignBoxAndLoto(Box box, Loto loto) {
        box.setLoto(loto);
        loto.setBox(box);
        changeBoxStatus(box);
        boxRepo.save(box);
        lotoService.saveEntity(loto);
    }
}
