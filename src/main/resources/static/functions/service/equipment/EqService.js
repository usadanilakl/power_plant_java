import EqRepo from "../../repository/EqRepo.js";
import FormService from "../dom/FormService.js";
import NewWindowService from "../dom/NewWindowService.js";
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
        let w = document.getElementById('point-info-window');
        if(w) w.parentElement.removeChild(w);

        let form = await FormService.buildFormFromObject(point); 
        let infoFrame = NewWindowService.getNewWindow("Point");
        infoFrame.setAttribute('data-window-type','point-info-window');
        infoFrame.appendChild(form);
        
        // if(selectedArea.lotoPoints){
        //     const list = await LotoService.lotoPointDropdown(selectedArea.lotoPoints); 
        //     // infoContainer.appendChild(list);
        //     document.getElementById('loto-point-container').appendChild(list);
        // } 
    }

}
export default EqService;