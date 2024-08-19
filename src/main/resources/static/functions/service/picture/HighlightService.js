import EqHighlightDom from "../../dom/picture/EqHighlightDom.js";
import GlobalVariables from "../../global/GlobalVariables.js";
import HighlightRepo from "../../repository/picture/HighlightRepo.js";
import AreaService from "./AreaService.js";
import ResizeRelocate from "./ResizeRelocate.js";

class HighlightService{

    static setUpHighlight(highlight){
        highlight.addEventListener('mousedown',(event)=>{
            event.preventDefault();
            ResizeRelocate.relocateHighlightsWithPicture(event);
            // updatePointInfo(event);
        });
    
        const zoom = ResizeRelocate.zoomPicture.bind(null,GlobalVariables.PICTURE);
        highlight.addEventListener('wheel',zoom);
    
        const dClick = AreaService.doubleClickArea.bind(null,highlight);
        highlight.addEventListener('click',dClick);
        setTimeout(()=>{
            highlight.removeEventListener('click',dClick);
            dbClick(highlight,()=>console.log("highlight one click"), ()=>console.log("highlight db click"));
        },300)
    
        
    
        HighlightRepo.ACTIVE_HIGHLIGHTS.push(highlight);
        // highlatedAreas.push(area);
        ResizeRelocate.initResize(highlight, true); //resizing tools setup (for editing)
        // highlight.querySelectorAll('.corners').forEach(e=>{
        //     e.addEventListener('click', updatePointInfo)
        // })
    }

    static createHighlight(area){
        let highlight = EqHighlightDom.buildHighlight(area);
        HighlightService.setUpHighlight(highlight);
    }

    static removeAllHighlights(){
        document.querySelectorAll('.areaHighlights').forEach(e=>{
            GlobalVariables.PICTURE_CONTAINER.removeChild(e);
            HighlightRepo.ACTIVE_HIGHLIGHTS = [];
            // highlatedAreas = [];
        })
    }

    static highlightAll(){
        let areas = document.querySelectorAll('.ar');
        removeAllHighlights();
        areas.forEach(e=>{
            createHighlight(e);
        })
    }

    static highlightLotoPoints(){
        let areas = document.querySelectorAll('[data-loto-point-area]');
        removeAllHighlights();
        areas.forEach(e=>{
            createHighlight(e);
        })
    }

    static removeLastHighlight(){
        let i = newHighlights.length-1;
        newHighlights.pop().element.remove();
    }
}
export default HighlightService;