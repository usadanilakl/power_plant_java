import EqHighlightDom from "../../dom/picture/EqHighlightDom.js";
import GlobalVariables from "../../global/GlobalVariables.js";
import EqRepo from "../../repository/EqRepo.js";
import AreaRepo from "../../repository/picture/AreaRepo.js";
import EqService from "../equipment/EqService.js";
import CoordinateCalculator from "./CoordinateCalculator.js";
import HighlightService from "./HighlightService.js";
import ResizeRelocate from "./ResizeRelocate.js";

class AreaService{
    static doubleClickArea(element){
        if(modes.viewMode.state) jumpToFile(element.getAttribute('name'))
        else if(modes.editMode.state) console.log('editing'+element.getAttribute('name'))
    }

    static areaClickFunction(area){
        event.preventDefault();
        HighlightService.removeAllHighlights();
        HighlightService.createHighlight(area);
        EqService.eqEditModeControl(); 
        EqRepo.SELECTED_EQ = EqRepo.getEqById(area.getAttribute('data-point-id'));
        // EqRepo.SELECTED_EQ = EqRepo.EQ_LIST.find(e=>e.id+''===area.getAttribute('data-point-id'))
        EqService.fillPointInfoWindow(EqRepo.SELECTED_EQ);
        // let points = EqService.getExcelPointsByLabel(AreaRepo.SELECTED_AREA.tagNumber);
        // EqService.fillExcelPointInfoWindow(points);
        //positionInfoWindowsInline();
    }

    static setUpArea(eq){
        let area = EqHighlightDom.buildArea(eq);
        let action = AreaService.areaClickFunction.bind(null,area);
        area.addEventListener('click',action);
        return area;
    }

    static setAreas(eqList){
        GlobalVariables.MAP.innerHTML = "";
        HighlightService.removeAllHighlights();
    
        eqList.forEach(e=>{
            EqRepo.OLD_WIDTH = CoordinateCalculator.originalPictureSizeStringToWh(e.originalPictureSize).w;
            let area = AreaService.setUpArea(e);
            GlobalVariables.MAP.appendChild(area);
        });
        ResizeRelocate.resizeAreas();
    }
}
export default AreaService;