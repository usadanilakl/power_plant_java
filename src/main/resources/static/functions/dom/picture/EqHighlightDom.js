import CoordinateCalculator from "../../service/picture/CoordinateCalculator.js";
import ResizeRelocate from "../../service/picture/ResizeRelocate.js";

class EqHighlightDom{
    static buildArea(highlight){
    
        console.log(JSON.stringify(highlight))
        let contentType = highlight.contentType;
        let content = highlight[contentType];
        let eq = null;
        if(content.objectType==="Equipment") eq=highlight.equipment;
        let coord = CoordinateCalculator.serverStringToAreaString(highlight.coordinates);
        let newArea = document.createElement('area');
        newArea.setAttribute('alt',highlight.tagNumber);
        newArea.setAttribute('title', highlight.tagNumber);
        newArea.setAttribute('data-point-id', highlight.id);
        //newArea.setAttribute('href',eq.label);
        newArea.setAttribute('class',"ar");
        //newArea.classList.add(eq.eqType.name.replace(/" "/g, ""));
        newArea.setAttribute('id',coord);
        //newArea.classList.add(area.type);
        newArea.setAttribute('coords', coord);
        newArea.setAttribute('shape',"rect");
    
        let directLotoPoint;
        if(eq && eq.lotoPoints!=null && eq.lotoPoints.length>0){
            directLotoPoint = eq.lotoPoints.find(e=>e.tagNumber===eq.tagNumber);
            if(!directLotoPoint) directLotoPoint = eq.lotoPoints[0];
            if(directLotoPoint.isoPos && directLotoPoint.isoPos.name && directLotoPoint.isoPos.name.toLowerCase().includes('open')){
                newArea.setAttribute('data-loto-point-area', true);
            }
            else if(directLotoPoint.isoPos && directLotoPoint.isoPos.name && directLotoPoint.isoPos.name.toLowerCase().includes('closed')){
                newArea.setAttribute('data-loto-point-area', false);
            }
            else newArea.setAttribute('data-loto-point-area', '');
        } 
    
        //drag(newArea,pictureContainer);
        newArea.addEventListener('mousedown',(event)=>{
            event.preventDefault();
            ResizeRelocate.relocateHighlightsWithPicture(event);
        })
    
        return newArea;
    }

    static buildHighlight(area){
        let position = CoordinateCalculator.areaStringToXywhObject(area);
        let coords = area.getAttribute('coords').split(",");
        let highlight = document.createElement('div');
        highlight.setAttribute('id', area.getAttribute('id') + "h");
        highlight.setAttribute('class','areaHighlights');
        //if(area.classList.contains('connector'))highlight.classList.add('connector')
        highlight.setAttribute('name',area.getAttribute('title'))
        //document.body.appendChild(highlight);
        document.getElementById('all').appendChild(highlight);
        highlight.style.width = position.w;
        highlight.style.height = position.h;
        highlight.style.position = 'fixed';
        let y = parseFloat(coords[1])+picture.offsetTop;
        let x = parseFloat(coords[0])+picture.offsetLeft;
        highlight.style.top = position.y;
        highlight.style.left = position.x;
        highlight.style.zIndex = '1';
            
        if(area.getAttribute('data-loto-point-area')==='true')highlight.setAttribute('data-loto-point-highlight',true);
        else if(area.getAttribute('data-loto-point-area')==='false')highlight.setAttribute('data-loto-point-highlight',false);
    
        return highlight;
    }
}
export default EqHighlightDom;