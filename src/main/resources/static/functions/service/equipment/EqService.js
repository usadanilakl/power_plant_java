import EqRepo from "../../repository/EqRepo.js";
import ModeService from "../mode/ModeService.js";
import LotoService from "../permits/LotoService.js";
import ResizeRelocate from "../picture/ResizeRelocate.js";
import BaseEqService from "./BaseEqService.js";

class EqService extends BaseEqService{
    static eqEditModeControl(){
        if(ModeService.MODES.viewMode.state){
            ResizeRelocate.hideAllResizeElements();
            // if(EqRepo.SELECTED_EQ) EqService.fillPointInfoWindow(EqRepo.SELECTED_EQ);
            
        }else if(ModeService.MODES.editMode.state){
            ResizeRelocate.showAllResizeElements();
            // EqService.fillPointInfoWindow(EqRepo.SELECTED_EQ);
            document.querySelectorAll('.addButtons').forEach(e=>{
                e.classList.add('hide');
            })
        }
    }

    static async fillPointInfoWindow(point){
        let form = await buildFormFromObject(point); 
        let infoFrame = document.getElementById('infoFramePoint');
        let infoContainer = document.getElementById('infoWindowPoint');
        if(infoContainer === null) newInfoWindow("Point");
        if(infoFrame.classList.contains('hide')) infoFrame.classList.remove('hide');
    
        infoContainer.innerHTML = "";
        infoContainer.appendChild(form);
        
        if(selectedArea.lotoPoints){
            const list = await LotoService.lotoPointDropdown(selectedArea.lotoPoints); 
            // infoContainer.appendChild(list);
            document.getElementById('loto-point-container').appendChild(list);
        } 
    }

}
export default EqService;