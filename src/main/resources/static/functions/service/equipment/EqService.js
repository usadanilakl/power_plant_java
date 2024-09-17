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
        let w = document.querySelector('[data-window-type="point-info-window"]');
        if(w) w.parentElement.removeChild(w);

        let form = await FormService.buildFormFromObject(point); 
        let infoFrame = NewWindowService.getNewWindow("Point",true);
        infoFrame.setAttribute('data-window-type','point-info-window');
        infoFrame.appendChild(form);
        infoFrame.style.height = 'fit-content';
        infoFrame.style.width = 'fit-content';
        
        if(EqRepo.SELECTED_EQ.lotoPoints){
            // const list = await LotoService.lotoPointDropdown(EqRepo.SELECTED_EQ.lotoPoints); 
            // // infoContainer.appendChild(list);
            // document.getElementById('loto-point-container').appendChild(list);
            console.log(EqRepo.SELECTED_EQ.lotoPoints.length)
        } 
    }

}
export default EqService;