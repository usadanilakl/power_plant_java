package com.dk_power.power_plant_java.sevice.permits;

import com.dk_power.power_plant_java.dto.permits.BoxDto;
import com.dk_power.power_plant_java.entities.permits.lotos.Box;
import com.dk_power.power_plant_java.entities.permits.lotos.Loto;

import java.util.List;

public interface BoxService {
    List<Box> getAllBoxes();
    List<Box> getEmptyBoxes();
    void addNewBox();
    Box getEmptyBox();
    void changeBoxStatus(Box box);
    void assignLoto(Loto loto);
    void resetLoto(Box box);
    BoxDto getBoxDtoById(Long id);

}
