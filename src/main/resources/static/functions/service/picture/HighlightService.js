import EqHighlightDom from "../../dom/picture/EqHighlightDom.js";
import GlobalVariables from "../../global/GlobalVariables.js";
import HighlightRepo from "../../repository/picture/HighlightRepo.js";
import UtilService from "../util/UtilService.js";
import AreaService from "./AreaService.js";
import ResizeRelocate from "./ResizeRelocate.js";

class HighlightService{

    static newHighlights = [];
    static coords = {
        getObjWidth : function(){return this.mouseOnPictureEnd.x-this.mouseOnPictureStart.x},
        getObjHeight : function(){return this.mouseOnPictureEnd.y-this.mouseOnPictureStart.y},       
    }

    static areaInfo = {
        tagNumber:null,
        description:null,
        location:"",//{category:"Location",name:null,id:null},
        specificLocation:null,
        system:"",//{category:"System",name:null,id:null},
        files:null,
        mainFile:null,
        coordinates:null,
        originalPictureSize:null,
        vendor:"", //{category:"Vendor",name:null,id:null},
        eqType:"", //{category:"Equipment Type",name:null,id:null},
        lotoPoints:[]
    }

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
            UtilService.dbClick(highlight,()=>console.log("highlight one click"), ()=>console.log("highlight db click"));
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
            GlobalVariables.ALL.removeChild(e);
            HighlightRepo.ACTIVE_HIGHLIGHTS = [];
            // highlatedAreas = [];
        })
    }

    static highlightAll(){
        let areas = document.querySelectorAll('.ar');
        HighlightService.removeAllHighlights();
        areas.forEach(e=>{
            HighlightService.createHighlight(e);
        })
    }

    static highlightLotoPoints(){
        let areas = document.querySelectorAll('[data-loto-point-area]');
        HighlightService.removeAllHighlights();
        areas.forEach(e=>{
            HighlightService.createHighlight(e);
        })
    }

    static removeLastHighlight(){
        let i = newHighlights.length-1;
        newHighlights.pop().element.remove();
    }

    static handleMouseDown(event) {
        if(event.button===2){
    
        let shape = document.createElement('div');
        shape.setAttribute('class', 'areaHighlights');
        all.appendChild(shape);
        newHighlights.push({element:shape});
        shape.addEventListener('mousedown',(event)=>{
            event.preventDefault();
            event.stopImmediatePropagation();
            event.stopPropagation();
            relocateHighlightsWithPicture(event);
        })
    
        coords.picture = getPictureCoordsOnScreen();
        coords.mouseOnScreenStart = registerMouseCoordsOnScreen(event);
        coords.mouseOnPictureStart = registerMouseCoordsOnPicture(event);
    
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup',handleMouseUp);    
    }
    }
      
    static handleMouseMove(event) {
    
        coords.mouseOnPictureEnd = registerMouseCoordsOnPicture(event);
    
        let highlight = newHighlights[newHighlights.length-1].element;
        highlight.style.width = (coords.mouseOnPictureEnd.x-coords.mouseOnPictureStart.x)+'px';
        highlight.style.height = (coords.mouseOnPictureEnd.y-coords.mouseOnPictureStart.y)+'px';
        // highlight.style.border = '2px solid blue';
        highlight.style.position = 'fixed';
        highlight.style.top = coords.mouseOnScreenStart.y+'px';
        highlight.style.left = coords.mouseOnScreenStart.x+'px';
        highlight.style.zIndex = '10';
    
            
        if(highlight.getAttribute('data-loto-point-highlight')==='true')highlight.style.border = '2px solid red';
        else if(highlight.getAttribute('data-loto-point-highlight')==='false')highlight.style.border = '2px solid green';
        else highlight.style.border = '2px solid blue';
    
    }
    
    static async handleMouseUp() {
    
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    
        await offsetSizing(picture);
        //await sendCoordinates();
    
        let areaCoordinates = 'StartX:'+coords.mouseOnPictureStart.x + ',StartY:' + coords.mouseOnPictureStart.y+ ',EndX:'+ coords.mouseOnPictureEnd.x + ',EndY:' + coords.mouseOnPictureEnd.y +',width:'+ coords.getObjWidth() +',height:'+ coords.getObjHeight();
        let id = coords.mouseOnPictureStart.x + ',' + coords.mouseOnPictureStart.y+ ','+ coords.mouseOnPictureEnd.x + ',' + coords.mouseOnPictureEnd.y;
        let picSize = picture.offsetWidth;
    
        // console.log(picSize)
        // console.log(getPictureSize()) //same as picSize
    
    
        newHighlights[newHighlights.length-1].id = id+'h';
        newHighlights[newHighlights.length-1].element.setAttribute('id',id+'h');
        newHighlights[newHighlights.length-1].picSize = picSize;
    
        if(coords.getObjWidth() > 20 && coords.getObjHeight() > 20){
            let image = document.getElementById('picture');
            areaInfo.coordinates = areaCoordinates;
            areaInfo.originalPictureSize = "width:"+image.naturalWidth + ",height:"+image.naturalHeight;
    
            areaInfo.tagNumber = "new Area";
            areaInfo.mainFile = file.fileLink;
            areaInfo.files = [];
            areaInfo.files.push(file.fileLink);
            if(file.vendor)areaInfo.vendor = file.vendor;
            if(file.system)areaInfo.system = file.system;
            areaInfo.eqType = null;
            areaInfo.location = null;
    
            if(!isGettingText){
                let area = createAreaElement(areaInfo);
                area.addEventListener('click',()=>{
                    event.preventDefault();
                    removeAllHighlights();
                    createHighlight(area);
                })
                //doubleClick(shape, e);
                map.appendChild(area);
                resizeNewArea(area);
                removeAllHighlights();
                createHighlight(area);
                // console.log(JSON.stringify(areaInfo))
                // console.log(JSON.stringify(selectedArea))
                //let newEq = await createNewEq(areaInfo);
                //file.points.push(newEq);
                selectedArea = areaInfo;
                fillPointInfoWindow(selectedArea);        
            }else{
                let text = await getText(areaInfo.coordinates);
                saveInClipboard(text);
                removeLastHighlight();
            }
        } else{
            removeLastHighlight();
        }
    
        
    }
}
export default HighlightService;