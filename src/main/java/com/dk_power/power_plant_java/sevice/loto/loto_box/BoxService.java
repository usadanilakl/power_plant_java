package com.dk_power.power_plant_java.sevice.loto.loto_box;

import com.dk_power.power_plant_java.dto.permits.loto_box.LotoBoxDto;
import com.dk_power.power_plant_java.entities.loto.LotoBox;
import com.dk_power.power_plant_java.entities.loto.Loto;
import com.dk_power.power_plant_java.mappers.UniversalMapper;
import com.dk_power.power_plant_java.repository.loto.LotoBoxRepo;
import com.dk_power.power_plant_java.sevice.base_services.CrudService;

import java.util.List;

public interface BoxService extends CrudService<LotoBox, LotoBoxDto, LotoBoxRepo, UniversalMapper> {
    List<LotoBox> getAllBoxes();
    List<LotoBox> getEmptyBoxes();
    void addNewBox();
    LotoBox getEmptyBox();
    void changeBoxStatus(LotoBox lotoBox);
    LotoBox assignLoto(Loto loto);
    void resetLoto(LotoBox lotoBox);
    LotoBoxDto getBoxDtoById(Long id);
    LotoBoxDto getBoxDtoByNumber(String number);
    LotoBox getBoxById(Long id);
    LotoBox saveBox(LotoBox lotoBox);
    void assignBoxAndLoto(LotoBox lotoBox, Loto loto);

}
