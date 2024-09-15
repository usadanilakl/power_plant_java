package com.dk_power.power_plant_java.sevice.loto.loto_point;

import com.dk_power.power_plant_java.dto.permits.LotoPointDto;
import com.dk_power.power_plant_java.dto.permits.LotoPointDtoLight;
import com.dk_power.power_plant_java.entities.categories.Value;
import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import com.dk_power.power_plant_java.mappers.LotoPointMapper;
import com.dk_power.power_plant_java.repository.loto.LotoPointRepo;
import com.dk_power.power_plant_java.sevice.base_services.RefactorService;
import com.dk_power.power_plant_java.sevice.data_transfer.excel.ExcelTransferService;

import java.util.List;


public interface LotoPointService extends ExcelTransferService<LotoPoint, LotoPointDto, LotoPointRepo, LotoPointMapper> , RefactorService{

    LotoPoint getByOldId(String oldId);

    List<LotoPoint> getByNormPos(Value oldVal);

    List<LotoPoint> getByIsoPos(Value oldVal);
    List<LotoPoint> getByValue(Value val);

    List<LotoPointDto> getByTagNumber(String tag);

    List<LotoPointDtoLight> getAllLight();

    List<LotoPointDto> getByTagNumberInDescription(String tag);

    List<LotoPointDto> getActiveLotoPoints();

}
