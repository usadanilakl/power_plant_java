package com.dk_power.power_plant_java.sevice.data_transfer;

import com.dk_power.power_plant_java.entities.equipment.Equipment;
import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import com.dk_power.power_plant_java.sevice.equipment.impl.EquipmentServiceImpl;
import com.dk_power.power_plant_java.sevice.loto.loto_point.LotoPointService;
import com.dk_power.power_plant_java.sevice.loto.loto_point.LotoPointServiceImpl;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@Transactional
@RequiredArgsConstructor
public class TransferToDataServiceProject {

    /*****************************************************************************************
     * POSSIBLE CONFLICTS AND CONFLICT RESOLUTION
     ****************************************************************************************/
    /**
     * MAIN OBJECTIVE:
     *      1. Each file contains file elements
     *      2. Each file element is linked to a file or equipment
     *      3. Loto point is child of Equipment so if loto point is created, equipment will be automatically created.
     *      4. Each equipment will have connections From and To other equipment.
     * POSSIBLE CONFLICTS:
     *     Duplicate equipment (excluding pipes) 371 - MEANS that same equipment is shown multiple times in a file(s), or tagNumber is not unique - SOLUTION: create file element for each instance, merge duplicates into one equipment, in case if it is 2 different equipment with matching tag - mark to indicate it.
     *     780 out of 5060 Equipment with multiple loto points found - MEANS that equipment has assosiations with other equipment - SOLUTION: create loto point for each instance and establish connections using To and From fields
     *     304 equipment that have loto point associated with them do not contain loto point that matches equipment tagNumber

     *     Duplicate loto points 521 (by tag number) - MEANS that same loto point was created multiple times, or tagNumber is not unique - SOLUTION: create loto point for each instance, merge duplicates into one loto point, in case if it is 2 different loto points with matching tag - mark
     *     loto points that belong to multiple equipment: 587 - MEANS that loto point has assosiations with other equipment - SOLUTION: create loto point for each instance and establish connections using To and From fields
     *     processed loto points: 7978/11712 - MEANS that some loto points are not processed and might be wrong - SOLUTION: process manually and associate with files or delete.
     *     not processed loto points: 3734


     * POSSIBLE CONFLICT RESOLUTION:
     *      Preconditions:resolve duplicates in equipment and loto points
     *      1. Transfer files
     *      2. Transfer loto points that have no conflicts
     *      3. Transfer equipment that have no conflicts
     *      4. Transfer heat trace to equipment
     *      5. Transfer electrical breakers and panels to equipment
     *      6. resolve equipment and loto point conflicts
     *      7. create FileElements with connections
     *      8. create equipment connections
     **/



    private final EquipmentServiceImpl equipmentService;
    private final LotoPointServiceImpl lotoPointService;

    public void transferExecution(){

    }

    private void transferFileObjects(){
        //Get all files
        //For each file:
            //Create new file object
            //Fill out fields
            //Register id of old file in new file object
            //Save new file object
    }


    private void transferEquipment(){
        //get all equipment
        List<Equipment> all = equipmentService.getAll();
        //for each equipment:
            //check if it has duplicates - handle duplicates
            //check if it has loto point that matches equipment tagNumber
    }

    private void createFileElements(){
        //Get all equipment
        //For each equipment:
            //Create new fileElement
            //if equipment is "Connector" - set fileElement type to "Connector", set tagNumber, set FileObject, setConnection to related FileObject
            //if equipment has loto points - check for conflicts, create new loto point, fill out fields, set FileElement
            //Register id of old equipment in new equipment
            //Save new equipment
    }

    private void createLotoPoints(){
        List<LotoPoint> all = lotoPointService.getAll();
        Set<String> tags = new HashSet<>();
        for (LotoPoint lp : all) {
            if(lp.getEquipmentList()!=null && lp.getEquipmentList().size()>0){
                if(!tags.add(lp.getTagNumber())){
                    //get existing loto point from data service progect
                    //merge datata
                    //send updated loto point back to data service project to be saved
                }else{

                }
            }
        }
    }

    private void duplcateConflictResolver(){
        //Get duplicates
        //merge data
    }
}
