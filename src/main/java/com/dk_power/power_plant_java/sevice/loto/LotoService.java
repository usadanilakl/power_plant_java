package com.dk_power.power_plant_java.sevice.loto;

import com.dk_power.power_plant_java.dto.permits.LotoDto;
import com.dk_power.power_plant_java.entities2.loto.Loto;
import com.dk_power.power_plant_java.enums.Status;

import java.util.List;

public interface LotoService {
    List<Loto> getAll();
    List<Loto> getAllSorted(String column);
    Loto getEntityById(Long id);
    LotoDto getDtoById(String ID);
    List<Loto> getByCreatedBy();
    Loto saveEntity(Loto entity);
    Loto saveDto(LotoDto dto);
    Loto createNew(LotoDto dto);
    Loto changeStatus(Long id, Status status);
//    List<Loto> sortTable(String column);
//    List<Loto> filterTable(Map<String,String> filters);
//    List<Loto> getLastFilteredList();
//    List<Loto> clearFilters();
//    void filterNew(Loto entity);
//    Loto resetFields();
//    Loto convertToEntity(LotoDto dto, Class<Loto> tClass);
//    LotoDto convertToDto(Loto entity, Class<LotoDto> dClass);
    Loto getTempPermit();
//    String getLoggedInUserName();
    Long generatePermitNum();
    List<Loto> getRevision(Long id);
}
