package com.dk_power.power_plant_java.sevice.loto;

import com.dk_power.power_plant_java.dto.permits.BoxDto;
import com.dk_power.power_plant_java.entities.loto.Box;
import com.dk_power.power_plant_java.entities.loto.Loto;
import com.dk_power.power_plant_java.mappers.UniversalMapper;
import com.dk_power.power_plant_java.repository.loto.BoxRepo;
import com.dk_power.power_plant_java.sevice.base_services.CrudService;

import java.util.List;

public interface BoxService extends CrudService<Box,BoxDto, BoxRepo, UniversalMapper> {
    List<Box> getAllBoxes();
    List<Box> getEmptyBoxes();
    void addNewBox();
    Box getEmptyBox();
    void changeBoxStatus(Box box);
    Box assignLoto(Loto loto);
    void resetLoto(Box box);
    BoxDto getBoxDtoById(Long id);
    BoxDto getBoxDtoByNumber(String number);
    Box getBoxById(Long id);
    Box saveBox(Box box);
    void assignBoxAndLoto(Box box, Loto loto);

}
