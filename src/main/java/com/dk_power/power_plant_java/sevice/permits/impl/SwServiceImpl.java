package com.dk_power.power_plant_java.sevice.permits.impl;

import com.dk_power.power_plant_java.dto.permits.SwDto;
import com.dk_power.power_plant_java.entities.permits.Sw;
import com.dk_power.power_plant_java.enums.PermitTypes;
import com.dk_power.power_plant_java.enums.Status;
import com.dk_power.power_plant_java.repository.permits.SwRepo;
import com.dk_power.power_plant_java.sevice.permits.PermitNumbersService;
import com.dk_power.power_plant_java.sevice.permits.SwDtoService;
import com.dk_power.power_plant_java.sevice.permits.SwService;
import com.dk_power.power_plant_java.util.Util;
import lombok.AllArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
@Service
@AllArgsConstructor
@Transactional
public class SwServiceImpl implements SwService {
    private final SwRepo swRepo;
    private final SwDtoService swDtoService;
    private final PermitNumbersService permitNumbersService;
    /***********************************Table Sorting and Searching:*********************************/
    private static String lastSortingRequest = "";
    private static boolean ascending = true;
    private static List<Sw> swList;
    private static Map<String,String> lastSetOfFileters;
    public static String getFieldByName(Sw sw, String fieldName){
        if(fieldName.equals("workScope")) return sw.getWorkScope();
        else if(fieldName.equals("swNum")) return (""+sw.getSwNum());
        else if(fieldName.equals("requestor")) return sw.getRequestor();
        return null;
    }
    public static List<Sw> filterSwList(List<Sw> sw, String searchValue, String column){
        swList.removeIf(e->!getFieldByName(e,column).contains(searchValue));
        return swList;
    }
    public static void sortSwListAsc(List<Sw> sw, String fieldName){
        if(fieldName.equals("workScope")) sw.sort(Comparator.comparing(Sw::getWorkScope,Comparator.nullsLast(Comparator.naturalOrder())));
        else if(fieldName.equals("lotoNum")) sw.sort(Comparator.comparing(Sw::getSwNum,Comparator.nullsLast(Comparator.naturalOrder())));
        else if(fieldName.equals("requestor")) sw.sort(Comparator.comparing(Sw::getRequestor,Comparator.nullsLast(Comparator.naturalOrder())));
    }
    public static void sortSwListDesc(List<Sw> sw, String fieldName){
        if(fieldName.equals("workScope")) sw.sort(Comparator.comparing(Sw::getWorkScope,Comparator.nullsLast(Comparator.naturalOrder())).reversed());
        else if(fieldName.equals("lotoNum")) sw.sort(Comparator.comparing(Sw::getSwNum,Comparator.nullsLast(Comparator.naturalOrder())).reversed());
        else if(fieldName.equals("requestor")) sw.sort(Comparator.comparing(Sw::getRequestor,Comparator.nullsLast(Comparator.naturalOrder())).reversed());
    }

    /**************************************************************************************************/
    @Override
    public List<Sw> getAllSw() {
        return Util.toList(swRepo.findAll());
    }
    @Override
    public List<Sw> getAllSorted(Sort column) {
        return swRepo.findAll(column);
    }
    @Override
    public Sw getById(Long id) {
        return swRepo.findById(id).orElse(null);
    }
    @Override
    public Sw saveSw(Sw sw) {
        swRepo.save(sw);
        filterNew(sw);
        return sw;
    }
    @Override
    public Sw createNewSw(SwDto sw) {
        Sw entity = swDtoService.toEntity(sw);
        entity.setSwNum(permitNumbersService.getNumber(PermitTypes.SAFE_WORK));
        entity.setStatus(Status.INCATCIVE);
        filterNew(entity);
        return saveSw(entity);
    }
    @Override
    public Sw changeStatus(Long id, Status status) {
        Sw sw = getById(id);
        sw.setStatus(status);
        return sw;
    }
    @Override
    public List<Sw> sortTable(String column) {
        if(swList==null) swList = getAllSw();
        if(lastSortingRequest.equals(column)){
            if(ascending) ascending = false;
            else ascending = true;
        }
        if(ascending){
//            lotos = getAllSorted(Sort.by(column));
            sortSwListAsc(swList,column);
        }else {
//            lotos = getAllSorted(Sort.by(Sort.Direction.DESC, column));
            sortSwListDesc(swList,column);
        }
        lastSortingRequest = column;
        return swList;
    }
    @Override
    public List<Sw> filterTable(Map<String, String> filters) {
        swList = getAllSw();
        for(Map.Entry<String,String> e : filters.entrySet()){
            filterSwList(swList,e.getValue(),e.getKey());
        }
        return sortTable("swNum");
    }
    @Override
    public List<Sw> getLastFilter() {
        if(swList==null) swList = getAllSw();
        return swList;
    }
    @Override
    public List<Sw> clearFilters() {
        swList = getAllSw();
        return swList;
    }
    @Override
    public void filterNew(Sw sw) {
        boolean contains = true;
        if(lastSetOfFileters!=null){
            for(Map.Entry<String,String> e : lastSetOfFileters.entrySet()){
                if(!getFieldByName(sw,e.getKey()).contains(e.getValue())) contains = false;
            }
        }
        if(swList!=null){
            for (Sw el : swList) {
                if(el.getId().equals(sw.getId())){
                    el.copy(sw);
                    return;
                }
            }
        }

        if(contains)swList.add(sw);
    }

}
