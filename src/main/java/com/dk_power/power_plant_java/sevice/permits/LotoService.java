package com.dk_power.power_plant_java.sevice.permits;

import com.dk_power.power_plant_java.dto.permits.LotoDto;
import com.dk_power.power_plant_java.entities.permits.Loto;
import com.dk_power.power_plant_java.enums.Status;
import org.springframework.data.domain.Sort;

import java.util.List;
import java.util.Map;

public interface LotoService {
    List<Loto> getAllLotos();
    List<Loto> getAllSorted(Sort column);
    Loto getLotoById(Long id);
    Loto saveLoto(Loto loto);
    Loto createNewLoto(LotoDto loto);
    Loto changeStatus(Long id, Status status);
    List<Loto> sortTable(String column);
    List<Loto> filterTable(Map<String,String> filters);
    List<Loto> getLastFilter();
    List<Loto> clearFilters();
    public void filterNew(Loto loto);


}
