package com.dk_power.power_plant_java.sevice.loto;

import com.dk_power.power_plant_java.dto.permits.LotoDto;
import com.dk_power.power_plant_java.entities2.loto.Loto;
import com.dk_power.power_plant_java.enums.Status;

import java.util.List;
import java.util.Map;

public interface LotoService {
    List<Loto> getAll();
    List<Loto> getAllSorted(String column);
    Loto getById(Long id);
    List<Loto> getByCreatedBy();
    Loto save(Loto entity);
    Loto createNew(LotoDto dto, Class<Loto> tClass);
    Loto changeStatus(Long id, Status status);
    List<Loto> sortTable(String column);
    List<Loto> filterTable(Map<String,String> filters);
    List<Loto> getLastFilteredList();
    List<Loto> clearFilters();
    void filterNew(Loto entity);
    Loto resetFields();
    Loto convertToEntity(LotoDto dto, Class<Loto> tClass);
    LotoDto convertToDto(Loto entity, Class<LotoDto> dClass);
    Loto getTempPermit();
    String getLoggedInUserName();
    Long generatePermitNum();
    List<Loto> getRevision(Long id,Class<Loto> entityClass);
    LotoDto getDtoById(String ID);
}
