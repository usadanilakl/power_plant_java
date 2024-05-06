package com.dk_power.power_plant_java.sevice.permits.impl;

import com.dk_power.power_plant_java.dto.permits.LotoDto;
import com.dk_power.power_plant_java.entities.permits.Loto;
import com.dk_power.power_plant_java.enums.PermitTypes;
import com.dk_power.power_plant_java.enums.Status;
import com.dk_power.power_plant_java.repository.permits.LotoRepo;
import com.dk_power.power_plant_java.sevice.permits.LotoDtoService;
import com.dk_power.power_plant_java.sevice.permits.LotoService;
import com.dk_power.power_plant_java.sevice.permits.PermitNumbersService;
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
public class LotoServiceImpl implements LotoService {
    private final LotoRepo lotoRepo;
    private final LotoDtoService lotoDtoService;
    private final PermitNumbersService permitNumbersService;

    /***********************************Table Sorting and Searching:*********************************/
    private static String lastSortingRequest = "";
    private static boolean ascending = true;
    private static List<Loto> lotos;
    private static Map<String,String> lastSetOfFileters;
    public static String getFieldByName(Loto loto, String fieldName){
        if(fieldName.equals("workScope")) return loto.getWorkScope();
        else if(fieldName.equals("lotoNum")) return (""+loto.getLotoNum());
        else if(fieldName.equals("requestor")) return loto.getRequestor();
        return null;
    }
    public static List<Loto> filterLotos(List<Loto> lotos, String searchValue, String column){
        lotos.removeIf(e->!getFieldByName(e,column).contains(searchValue));
        return lotos;
    }
    public static void sortLotoListAsc(List<Loto> lotos, String fieldName){
        if(fieldName.equals("workScope")) lotos.sort(Comparator.comparing(Loto::getWorkScope,Comparator.nullsLast(Comparator.naturalOrder())));
        else if(fieldName.equals("lotoNum")) lotos.sort(Comparator.comparing(Loto::getLotoNum,Comparator.nullsLast(Comparator.naturalOrder())));
        else if(fieldName.equals("requestor")) lotos.sort(Comparator.comparing(Loto::getRequestor,Comparator.nullsLast(Comparator.naturalOrder())));
    }
    public static void sortLotoListDesc(List<Loto> lotos, String fieldName){
        if(fieldName.equals("workScope")) lotos.sort(Comparator.comparing(Loto::getWorkScope,Comparator.nullsLast(Comparator.naturalOrder())).reversed());
        else if(fieldName.equals("lotoNum")) lotos.sort(Comparator.comparing(Loto::getLotoNum,Comparator.nullsLast(Comparator.naturalOrder())).reversed());
        else if(fieldName.equals("requestor")) lotos.sort(Comparator.comparing(Loto::getRequestor,Comparator.nullsLast(Comparator.naturalOrder())).reversed());
    }
    /**************************************************************************************************/

    @Override
    public List<Loto> getAllLotos() {
        return Util.toList(lotoRepo.findAll());
    }
    @Override
    public List<Loto> getAllSorted(Sort column) {
        return lotoRepo.findAll(column);
    }
    @Override
    public Loto getLotoById(Long id) {
        return lotoRepo.findById(id).orElse(null);
    }
    @Override
    public Loto saveLoto(Loto loto) {
        lotoRepo.save(loto);
        filterNew(loto);
        return loto;
    }
    @Override
    public Loto createNewLoto(LotoDto loto) {
        Loto entity = lotoDtoService.toEntity(loto);
        entity.setLotoNum(permitNumbersService.getNumber(PermitTypes.LOTO));
        entity.setStatus(Status.INCATCIVE);
        filterNew(entity);
        return saveLoto(entity);
    }
    @Override
    public Loto changeStatus(Long id, Status status) {
        Loto loto = getLotoById(id);
        loto.setStatus(status);
        return loto;
    }
    @Override
    public void filterNew(Loto loto){
        boolean contains = true;
        if(lastSetOfFileters!=null){
            for(Map.Entry<String,String> e : lastSetOfFileters.entrySet()){
                if(!getFieldByName(loto,e.getKey()).contains(e.getValue())) contains = false;
            }
        }
        if(lotos!=null){
            for (Loto el : lotos) {
                if(el.getId().equals(loto.getId())){
                    el.copy(loto);
                    return;
                }
            }
        }
        if(contains)lotos.add(loto);
    }
    @Override
    public List<Loto> sortTable(String column){
        if(lotos==null) lotos = getAllLotos();
        if(lastSortingRequest.equals(column)){
            if(ascending) ascending = false;
            else ascending = true;
        }
        if(ascending){
//            lotos = getAllSorted(Sort.by(column));
            sortLotoListAsc(lotos,column);
        }else {
//            lotos = getAllSorted(Sort.by(Sort.Direction.DESC, column));
            sortLotoListDesc(lotos,column);
        }
        lastSortingRequest = column;
        return lotos;
    }
    @Override
    public List<Loto> filterTable(Map<String, String> filters) {
        lotos = getAllLotos();
        lastSetOfFileters = filters;
        for(Map.Entry<String,String> e : filters.entrySet()){
            filterLotos(lotos,e.getValue(),e.getKey());
        }
        return sortTable("lotoNum");
    }
    @Override
    public List<Loto> getLastFilter() {
        if(lotos==null) lotos = getAllLotos();
        return lotos;
    }
    @Override
    public List<Loto> clearFilters() {
        lotos = getAllLotos();
        return lotos;
    }


}
