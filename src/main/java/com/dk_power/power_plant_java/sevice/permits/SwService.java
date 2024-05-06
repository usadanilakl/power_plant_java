package com.dk_power.power_plant_java.sevice.permits;

import com.dk_power.power_plant_java.dto.permits.SwDto;
import com.dk_power.power_plant_java.entities.permits.Sw;
import com.dk_power.power_plant_java.enums.Status;
import org.springframework.data.domain.Sort;

import java.util.List;
import java.util.Map;

public interface SwService {
    List<Sw> getAllSw();
    List<Sw> getAllSorted(Sort column);
    Sw getById(Long id);
    Sw saveSw(Sw sw);
    Sw createNewSw(SwDto sw);
    Sw changeStatus(Long id, Status status);
    List<Sw> sortTable(String column);
    List<Sw> filterTable(Map<String,String> filters);
    List<Sw> getLastFilter();
    List<Sw> clearFilters();
    public void filterNew(Sw sw);


}
