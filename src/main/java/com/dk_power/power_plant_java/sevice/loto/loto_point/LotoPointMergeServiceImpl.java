package com.dk_power.power_plant_java.sevice.loto.loto_point;

import com.dk_power.power_plant_java.dto.permits.LotoPointDto;
import com.dk_power.power_plant_java.entities.categories.Value;
import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import com.dk_power.power_plant_java.mappers.LotoPointMapper;
import com.dk_power.power_plant_java.repository.loto.LotoPointRepo;
import com.dk_power.power_plant_java.sevice.data_transfer.excel.ExcelService;
import lombok.RequiredArgsConstructor;
import org.hibernate.SessionFactory;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
public class LotoPointMergeServiceImpl implements LotoPointMergeService{
    private final LotoPointRepo lotoPointRepo;
    private final SessionFactory sessionFactory;
    private final LotoPointMapper lotoPointMapper;
    @Override
    public LotoPoint getEntity() {
        return new LotoPoint();
    }

    @Override
    public LotoPointDto getDto() {
        return new LotoPointDto();
    }

    @Override
    public LotoPointRepo getRepo() {
        return lotoPointRepo;
    }

    @Override
    public LotoPointMapper getMapper() {
        return lotoPointMapper;
    }

    @Override
    public SessionFactory getSessionFactory() {
        return sessionFactory;
    }

    @Override
    public LotoPoint copyPointFromOtherUnit(Long id) {
        LotoPoint sourcePoint = getEntityById(id);
        String sourceTagNumber = sourcePoint.getTagNumber();
        String destenationTagNumber = "";
        String destDescription = "";
        String specificLocation = "";
        if(sourceTagNumber.startsWith("01")){
            destenationTagNumber = "02"+sourceTagNumber.substring(2);
            if(sourcePoint.getDescription()!=null)destDescription = Arrays.stream(sourcePoint.getDescription().split(" ")).map(e->{
                if(e.startsWith("01")) return e = "02"+e.substring(2);
                else return e;
            }).toList().toString()
            .replaceAll("Unit1", "Unit2")
            .replaceAll("Unit 1", "Unit 2")
            .replaceAll("U1", "U2")
            .replace("[","")
            .replace("]","")
            .replace(",","");

            if(sourcePoint.getSpecificLocation()!=null) specificLocation = Arrays.stream(sourcePoint.getSpecificLocation().split(" ")).map(e->{
                if(e.startsWith("01")) return e = "02"+e.substring(2);
                else return e;
            }).toList().toString()
            .replaceAll("Unit1", "Unit2")
            .replaceAll("Unit 1", "Unit 2")
            .replaceAll("U1", "U2")
            .replace("[","")
            .replace("]","")
            .replace(",","");

        }
        else if (sourceTagNumber.startsWith("02")){
            destenationTagNumber = "01"+sourceTagNumber.substring(2);

            if(sourcePoint.getDescription()!=null){
                destDescription = Arrays.stream(sourcePoint.getDescription().split(" ")).map(e->{
                    if(e.startsWith("02")) return e = "01"+e.substring(2);
                    else return e;
                }).toList().toString()
                .replaceAll("Unit2", "Unit1")
                .replaceAll("Unit 2", "Unit 1")
                .replaceAll("U2", "U1")
                .replace("[","")
                .replace("]","")
                .replace(",","");
            }

            if(sourcePoint.getDescription()!=null){
                specificLocation = Arrays.stream(sourcePoint.getSpecificLocation().split(" ")).map(e->{
                    if(e.startsWith("02")) return e = "01"+e.substring(2);
                    else return e;
                }).toList().toString()
                .replaceAll("Unit2", "Unit1")
                .replaceAll("Unit 2", "Unit 1")
                .replaceAll("U2", "U1")
                .replace("[","")
                .replace("]","")
                .replace(",","");
            }

        }

        List<LotoPoint> byTagNumber = null;
        if(!destenationTagNumber.equalsIgnoreCase("")) byTagNumber = lotoPointRepo.findByTagNumber(destenationTagNumber);

        if(byTagNumber!=null && byTagNumber.size()>1){
//            System.out.println("==================sourceTagNumber = " + sourceTagNumber+"================");
//            byTagNumber.forEach(e->{
//                System.out.println("tag: "+e.getTagNumber());
//                System.out.println("descr: "+e.getDescription());
//            });
//            System.out.println("=========================================================");
        }
        else if(byTagNumber!=null && byTagNumber.size()==1 && (byTagNumber.get(0).getDescription()==null || byTagNumber.get(0).getDescription().equalsIgnoreCase(""))){
//            System.out.println("=======================================================");
//            System.out.println("source: " + sourcePoint.getDescription());
//            System.out.println("dest: " + byTagNumber.get(0).getDescription());
//            System.out.println("=======================================================");
        }else if(!destenationTagNumber.equalsIgnoreCase("") && (byTagNumber==null || byTagNumber.size()==0)){
            LotoPoint newLotoPoint = new LotoPoint();
            newLotoPoint.setTagNumber(destenationTagNumber);
            newLotoPoint.setSpecificLocation(specificLocation);
            newLotoPoint.setDescription(destDescription);
            newLotoPoint.setIsoPos(sourcePoint.getIsoPos());
            newLotoPoint.setNormPos(sourcePoint.getNormPos());
            save(newLotoPoint);

//            System.out.println("==============================================================================");
//            System.out.println(sourcePoint.getTagNumber() + "||" + sourcePoint.getDescription() + "||" + sourcePoint.getSpecificLocation());
//            System.out.println(destenationTagNumber+ "||" + destDescription + "||" + specificLocation);
        }
        return null;
    }
}
