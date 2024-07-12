package com.dk_power.power_plant_java.sevice.data_transfer.excel;

import com.dk_power.power_plant_java.entities.base_entities.BaseIdEntity;
import com.dk_power.power_plant_java.mappers.BaseMapper;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;
import com.dk_power.power_plant_java.sevice.base_services.CrudService;

import java.util.List;

public interface ExcelTransferService<
        E extends BaseIdEntity,
        D,
        R extends BaseRepository<E>,
        M extends BaseMapper> extends CrudService<E,D,R,M>
{
    List<E> transferExcelToDB();
}
