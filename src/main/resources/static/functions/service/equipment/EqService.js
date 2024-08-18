import BaseEqService from "./BaseEqService.js";

class EqService extends BaseEqService{
    static eqEditModeControl(){
        if(modes.viewMode.state){
            hideAllResizeElements();
            if(selectedArea) fillPointInfoWindow(selectedArea);
            
        }else if(modes.editMode.state){
            showAllResizeElements();
            fillPointInfoWindow(selectedArea);
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
            const list = await lotoPointDropdown(selectedArea.lotoPoints); 
            // infoContainer.appendChild(list);
            document.getElementById('loto-point-container').appendChild(list);
        } 
    }

}
export default EqService;