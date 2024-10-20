package com.dk_power.power_plant_java.sevice;

import com.dk_power.power_plant_java.entities.base_entities.BasePermitEntity;
import lombok.Data;
import org.springframework.stereotype.Service;

@Service
@Data
public class FilterService<T extends BasePermitEntity>{
//    private String lastSortingRequest;
//    private Boolean ascending = true;
//    private List<T> permits;
//    private Map<String,String> lastSetOfFileters;
//
//    public FilterService(PermitRepo<T> basePermitRepo) {
//        this.basePermitRepo = basePermitRepo;
//        this.lastSortingRequest = "";
//        this.ascending = true;
//        this.permits = Util.toList(basePermitRepo.findAll());
//        this.lastSetOfFileters = null;
//    }
//
//    public Object getFieldByName(T obj, String name){
//        try {
//            Method method = obj.getClass().getMethod(name);
//            if(method.invoke(obj)!=null) return method.invoke(obj);
//            else return "";
//        } catch (NoSuchMethodException | InvocationTargetException | IllegalAccessException e) {
//            throw new RuntimeException(e);
//        }
//    }
//    public List<T> filterPermits(String serachValue, String column){
//        permits.removeIf(e->!(getFieldByName(e,column)).toString().contains(serachValue));
//        return permits;
//    }
//    public void sortListAsc(String fieldName){
//        permits.sort(Comparator.comparing(e->getFieldByName(e,fieldName).toString(), Comparator.nullsLast(Comparator.naturalOrder())));
//    }
//    public void sortListDsc(String fieldName){
//        permits.sort(Comparator.comparing(e-> Optional.of(getFieldByName((T)e,fieldName)).orElse("null").toString(), Comparator.nullsLast(Comparator.naturalOrder())).reversed());
//    }
//    public List<T> addItem(T item){
//        permits.add(item);
//        return permits;
//    }
//
//    public boolean updateItem(T item){
//        int index = permits.indexOf(item);
//        if(index!=-1){
//            permits.set(index,item);
//            return true;
//        }
//        return false;
//    }




}
